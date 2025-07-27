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

// Get activity logs with filtering and pagination
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const {
      search = '',
      type = 'all',
      dateRange = 'all',
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build the query
    let query = supabase
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
      `, { count: 'exact' });

    // Apply filters
    if (type !== 'all') {
      query = query.eq('activity_type', type);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,profiles.full_name.ilike.%${search}%`);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      activities: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log activity endpoint
router.post('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const { activity_type, description, service_id, metadata } = req.body;

    // Validate required fields
    if (!activity_type || !description) {
      return res.status(400).json({ error: 'activity_type and description are required' });
    }

    // Insert activity log
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        service_id: service_id || null,
        activity_type,
        description,
        metadata: metadata || {},
        user_agent: req.headers['user-agent'] || null
      })
      .select()
      .single();

    if (error) {
      console.error('Activity log error:', error);
      return res.status(500).json({ error: 'Failed to log activity' });
    }

    res.status(201).json({ message: 'Activity logged successfully', data });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;