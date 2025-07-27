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

// Get all services with user counts
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    let query = supabase
      .from('services')
      .select(`
        *,
        user_service_roles (
          id,
          user_id,
          role,
          profiles!user_service_roles_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    // If user is not super admin, filter to only their services
    if (req.userRole !== 'super_admin') {
      const { data: userServices } = await supabase
        .from('user_service_roles')
        .select('service_id')
        .eq('user_id', req.user.id)
        .eq('role', 'admin');
      
      if (!userServices || userServices.length === 0) {
        return res.json([]);
      }
      
      const serviceIds = userServices.map(s => s.service_id);
      query = query.in('id', serviceIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add default services if they don't exist (only for super admin)
    if (req.userRole === 'super_admin') {
      const defaultServices = [
        {
          name: 'Mattermost',
          description: 'Team collaboration and messaging platform for secure communication.',
          status: 'active',
          config: { version: '9.0', environment: 'production', url: 'https://mattermost.example.com' }
        },
        {
          name: 'Apache Superset',
          description: 'Modern data exploration and visualization platform for business intelligence.',
          status: 'active',
          config: { version: '3.0', environment: 'production', url: 'https://superset.example.com' }
        }
      ];

      for (const defaultService of defaultServices) {
        const existingService = data.find(s => s.name === defaultService.name);
        if (!existingService) {
          try {
            const { data: newService, error: createError } = await supabase
              .from('services')
              .insert({
                ...defaultService,
                created_by: req.user.id
              })
              .select(`
                *,
                user_service_roles (
                  id,
                  user_id,
                  role,
                  profiles!user_service_roles_user_id_fkey (
                    id,
                    full_name,
                    email,
                    avatar_url
                  )
                )
              `)
              .single();

            if (!createError && newService) {
              // Make the current user an admin of the new service
              await supabase
                .from('user_service_roles')
                .insert({
                  user_id: req.user.id,
                  service_id: newService.id,
                  role: 'admin',
                  granted_by: req.user.id
                });

              // Add the new service to the response
              data.push(newService);
            }
          } catch (createError) {
            console.error(`Error creating default service ${defaultService.name}:`, createError);
          }
        }
      }
    }

    const servicesWithCounts = data.map(service => {
      const roles = service.user_service_roles || [];
      const admins = roles.filter(role => role.role === 'admin').map(role => role.profiles);
      const users = roles.filter(role => role.role === 'user').map(role => role.profiles);

      return {
        ...service,
        adminCount: admins.length,
        userCount: users.length,
        totalUsers: roles.length,
        admins: admins.filter(Boolean),
        users: users.filter(Boolean),
        user_service_roles: roles
      };
    });

    res.json(servicesWithCounts);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single service
router.get('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        user_service_roles (
          id,
          user_id,
          role,
          granted_at,
          profiles!user_service_roles_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      throw error;
    }

    const roles = data.user_service_roles || [];
    const admins = roles.filter(role => role.role === 'admin').map(role => role.profiles);
    const users = roles.filter(role => role.role === 'user').map(role => role.profiles);

    const serviceWithCounts = {
      ...data,
      adminCount: admins.length,
      userCount: users.length,
      totalUsers: roles.length,
      admins: admins.filter(Boolean),
      users: users.filter(Boolean),
      user_service_roles: roles
    };

    res.json(serviceWithCounts);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, config } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        name,
        description,
        config: config || {},
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Service created successfully',
      service: data
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service
router.put('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('services')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Service updated successfully',
      service: data
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service
router.delete('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;