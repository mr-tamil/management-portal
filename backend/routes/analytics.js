import express from 'express';
import { authenticateToken } from './auth.js';
import { supabase } from '../server.js';

const router = express.Router();

// Check app access middleware
const checkAppAccess = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('role, is_active')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: 'No app access' });
    }

    req.userRole = data.role;
    next();
  } catch (error) {
    console.error('App access check error:', error);
    res.status(500).json({ error: 'Failed to verify app access' });
  }
};

// Get analytics data
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Get user growth data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('is_active', true)
      .order('created_at');

    // Process user growth data
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = 0;
    }

    // Count users by month
    profiles?.forEach(user => {
      const date = new Date(user.created_at);
      const monthKey = months[date.getMonth()];
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    const userGrowth = Object.entries(monthlyData).map(([month, users]) => ({ month, users }));

    // Get service usage data (count of users per service)
    const { data: services } = await supabase
      .from('services')
      .select(`
        name,
        user_service_roles (count)
      `);

    const serviceUsage = (services || []).map(service => ({
      service: service.name,
      usage: service.user_service_roles?.length || 0
    }));

    // Get system metrics
    const { data: metrics } = await supabase
      .from('service_metrics')
      .select('metric_name, metric_value')
      .order('recorded_at', { ascending: false });

    // Calculate averages for each metric type
    const metricGroups = {};
    metrics?.forEach(metric => {
      if (!metricGroups[metric.metric_name]) {
        metricGroups[metric.metric_name] = [];
      }
      metricGroups[metric.metric_name].push(metric.metric_value);
    });

    const systemMetrics = [];
    
    if (metricGroups.uptime) {
      const avgUptime = metricGroups.uptime.reduce((a, b) => a + b, 0) / metricGroups.uptime.length;
      systemMetrics.push({ name: 'Uptime', value: avgUptime, color: '#10b981' });
    }
    
    if (metricGroups.response_time) {
      const avgResponseTime = metricGroups.response_time.reduce((a, b) => a + b, 0) / metricGroups.response_time.length;
      const responseTimePercentage = Math.max(0, 100 - (avgResponseTime / 200) * 100);
      systemMetrics.push({ name: 'Response Time', value: responseTimePercentage, color: '#3b82f6' });
    }
    
    if (metricGroups.error_rate) {
      const avgErrorRate = metricGroups.error_rate.reduce((a, b) => a + b, 0) / metricGroups.error_rate.length;
      systemMetrics.push({ name: 'Error Rate', value: avgErrorRate, color: '#ef4444' });
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles (
          full_name,
          email,
          avatar_url
        ),
        services (
          name,
          description
        )
      `)
      .eq('activity_type', 'admin_action')
      .order('created_at', { ascending: false })
      .limit(20);

    // Process recent activity to show personalized messages
    const processedActivity = (recentActivity || []).map(activity => {
      const isCurrentUser = activity.user_id === req.user.id;
      let description = activity.description;
      
      // Personalize the description based on who performed the action
      if (isCurrentUser) {
        // Replace third person with "You"
        if (activity.metadata?.action === 'create_user') {
          description = `You created user: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'grant_app_access') {
          description = `You granted ${activity.metadata.granted_role} app access to ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'remove_app_user') {
          description = `You removed app access for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'update_app_role') {
          description = `You updated ${activity.metadata.target_user_name}'s app role to ${activity.metadata.new_role}`;
        } else if (activity.metadata?.action === 'grant_service_access') {
          description = `You granted ${activity.metadata.granted_role} access to ${activity.metadata.service_name} for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'revoke_service_access') {
          description = `You revoked access to ${activity.metadata.service_name} for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'update_user') {
          description = `You updated user profile: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'deactivate_user') {
          description = `You deactivated user: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'activate_user') {
          description = `You activated user: ${activity.metadata.target_user_name}`;
        }
      } else {
        // Show who performed the action
        const actorName = activity.profiles?.full_name || 'Someone';
        if (activity.metadata?.action === 'create_user') {
          description = `${actorName} created user: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'grant_app_access') {
          description = `${actorName} granted ${activity.metadata.granted_role} app access to ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'remove_app_user') {
          description = `${actorName} removed app access for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'update_app_role') {
          description = `${actorName} updated ${activity.metadata.target_user_name}'s app role to ${activity.metadata.new_role}`;
        } else if (activity.metadata?.action === 'grant_service_access') {
          description = `${actorName} granted ${activity.metadata.granted_role} access to ${activity.metadata.service_name} for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'revoke_service_access') {
          description = `${actorName} revoked access to ${activity.metadata.service_name} for ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'update_user') {
          description = `${actorName} updated user profile: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'deactivate_user') {
          description = `${actorName} deactivated user: ${activity.metadata.target_user_name}`;
        } else if (activity.metadata?.action === 'activate_user') {
          description = `${actorName} activated user: ${activity.metadata.target_user_name}`;
        }
      }
      
      return {
        ...activity,
        description,
        isCurrentUser
      };
    });

    res.json({
      userGrowth,
      serviceUsage,
      systemMetrics: systemMetrics.length > 0 ? systemMetrics : [
        { name: 'Uptime', value: 99.9, color: '#10b981' },
        { name: 'Response Time', value: 85, color: '#3b82f6' },
        { name: 'Error Rate', value: 0.5, color: '#ef4444' }
      ],
      recentActivity: processedActivity
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;