import express from 'express';
import Joi from 'joi';
import { authenticateToken, requireAdmin } from './auth.js';
import { supabase } from '../server.js';

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user')
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100),
  is_active: Joi.boolean(),
  role: Joi.string().valid('admin', 'user')
});

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

// Get all users with pagination and filtering
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const {
      search = '',
      role = 'all',
      status = 'all',
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_service_roles!user_service_roles_user_id_fkey (
          id,
          role,
          service_id,
          granted_at,
          services (
            id,
            name,
            description
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Process users with roles
    const usersWithRoles = (data || []).map(user => {
      const userRoles = user.user_service_roles?.map(role => role.role) || [];
      
      // Filter by role if specified
      if (role !== 'all') {
        if (role === 'none') {
          const hasRole = userRoles.length === 0;
          if (!hasRole) return null;
        } else {
        const hasRole = userRoles.includes(role);
        if (!hasRole) return null;
        }
      }

      return {
        ...user,
        roles: userRoles
      };
    }).filter(Boolean);

    res.json({
      users: usersWithRoles,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users endpoint for autocomplete
router.get('/search', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const { search = '', limit = 20 } = req.query;

    if (!search.trim()) {
      return res.json({ users: [] });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, is_active')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .eq('is_active', true)
      .order('full_name')
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ users: data || [] });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_service_roles!user_service_roles_user_id_fkey (
          id,
          role,
          service_id,
          granted_at,
          granted_by,
          services (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    // Get user's activity logs (both as actor and target)
    const { data: userActivity } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles!activity_logs_user_id_fkey (
          full_name,
          email,
          avatar_url
        ),
        services (
          name,
          description
        )
      `)
      .or(`user_id.eq.${id},metadata->>target_user_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    const userWithRoles = {
      ...data,
      roles: data.user_service_roles?.map(role => role.role) || [],
      recent_activity: userActivity || []
    };

    res.json(userWithRoles);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user - FIXED VERSION
router.post('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.userRole === 'super_admin') {
      // Super admin can see all users
      // No additional filtering needed
    } else if (req.userRole === 'admin') {
      // Regular admin can only see users from their services
      const { data: adminServices } = await supabase
        .from('user_service_roles')
        .select('service_id')
        .eq('user_id', req.user.id)
        .eq('role', 'admin');
      
      if (!adminServices || adminServices.length === 0) {
        return res.json({
          users: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        });
      }
      
      const serviceIds = adminServices.map(s => s.service_id);
      
      // Filter users to only those who have access to admin's services
      query = query.in('user_service_roles.service_id', serviceIds);
    } else {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate request body
    const { error: validationError, value } = createUserSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validationError.details[0].message 
      });
    }

    console.log('Creating user with data:', { email: value.email, full_name: value.full_name });

    // Check if user already exists in profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', value.email)
      .single();
    
    if (existingProfile) {
      return res.status(400).json({ 
        error: 'User already exists', 
        details: 'A user with this email address already exists' 
      });
    }

    // Check if user exists in auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const userExists = existingAuthUser.users?.some(user => user.email === value.email);
    
    if (userExists) {
      return res.status(400).json({ 
        error: 'User already exists in authentication system', 
        details: 'A user with this email address already exists' 
      });
    }

    // Create auth user with proper error handling
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: value.email,
      password: value.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: value.full_name
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(400).json({ 
        error: 'Failed to create user account', 
        details: authError.message 
      });
    }

    if (!authData?.user) {
      return res.status(400).json({ 
        error: 'Failed to create user account', 
        details: 'No user data returned from auth service' 
      });
    }

    console.log('Auth user created successfully:', authData.user.id);

    // Wait a moment for any triggers to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Use the database function to create profile safely
    const { data: profileData, error: profileError } = await supabase
      .rpc('create_user_profile', {
        user_id: authData.user.id,
        user_email: value.email,
        user_full_name: value.full_name
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      return res.status(400).json({ 
        error: 'Failed to create user profile', 
        details: profileError.message 
      });
    }

    console.log('Profile created successfully:', profileData);

    // Get the created profile with proper structure
    const { data: finalProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created profile:', fetchError);
      return res.status(500).json({ 
        error: 'User created but failed to fetch profile', 
        details: fetchError.message 
      });
    }

    const userWithRoles = { 
      ...finalProfile, 
      roles: [],
      user_service_roles: []
    };

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        activity_type: 'admin_action',
        description: `Created new user: ${value.full_name}`,
        metadata: {
          action: 'create_user',
          target_user_id: authData.user.id,
          target_user_name: value.full_name,
          target_user_email: value.email,
          initial_role: value.role
        }
      });

    console.log('User creation completed successfully');

    res.status(201).json({
      message: 'User created successfully',
      user: userWithRoles
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update user
router.put('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error: validationError, value } = updateUserSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validationError.details[0].message 
      });
    }

    // Get current user details for logging
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedUser = { ...data, roles: [] };

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        activity_type: 'admin_action',
        description: `Updated user profile: ${updatedUser.full_name}`,
        metadata: {
          action: 'update_user',
          target_user_id: id,
          target_user_name: updatedUser.full_name,
          changes: value
        }
      });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status (activate/deactivate)
router.patch('/:id/status', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Get user details before update for logging
    const { data: userToUpdate } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_active, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const updatedUser = { ...data, roles: [] };

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        activity_type: 'admin_action',
        description: `${is_active ? 'Activated' : 'Deactivated'} user: ${userToUpdate?.full_name || 'Unknown User'}`,
        metadata: {
          action: is_active ? 'activate_user' : 'deactivate_user',
          target_user_id: id,
          target_user_name: userToUpdate?.full_name,
          target_user_email: userToUpdate?.email
        }
      });

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user (legacy endpoint)
router.patch('/:id/deactivate', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Get user details before deactivation for logging
    const { data: userToDeactivate } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const updatedUser = { ...data, roles: [] };

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        activity_type: 'admin_action',
        description: `Deactivated user: ${userToDeactivate?.full_name || 'Unknown User'}`,
        metadata: {
          action: 'deactivate_user',
          target_user_id: id,
          target_user_name: userToDeactivate?.full_name,
          target_user_email: userToDeactivate?.email
        }
      });

    res.json({
      message: 'User deactivated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grant service access
router.post('/:userId/services/:serviceId/access', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, serviceId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    // Get user and service details for logging
    const [userResult, serviceResult] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', userId).single(),
      supabase.from('services').select('name').eq('id', serviceId).single()
    ]);

    const { data, error } = await supabase
      .from('user_service_roles')
      .insert({
        user_id: userId,
        service_id: serviceId,
        role,
        granted_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        service_id: serviceId,
        activity_type: 'admin_action',
        description: `Granted ${role} access to ${serviceResult.data?.name || 'service'} for ${userResult.data?.full_name || 'user'}`,
        metadata: {
          action: 'grant_service_access',
          target_user_id: userId,
          target_user_name: userResult.data?.full_name,
          target_user_email: userResult.data?.email,
          service_name: serviceResult.data?.name,
          granted_role: role
        }
      });

    res.json({
      message: 'Service access granted successfully',
      data
    });
  } catch (error) {
    console.error('Grant service access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke service access
router.delete('/:userId/services/:serviceId/access', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, serviceId } = req.params;

    // Get user and service details for logging before deletion
    const [userResult, serviceResult] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', userId).single(),
      supabase.from('services').select('name').eq('id', serviceId).single()
    ]);

    const { error } = await supabase
      .from('user_service_roles')
      .delete()
      .eq('user_id', userId)
      .eq('service_id', serviceId);

    if (error) throw error;

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        service_id: serviceId,
        activity_type: 'admin_action',
        description: `Revoked access to ${serviceResult.data?.name || 'service'} for ${userResult.data?.full_name || 'user'}`,
        metadata: {
          action: 'revoke_service_access',
          target_user_id: userId,
          target_user_name: userResult.data?.full_name,
          target_user_email: userResult.data?.email,
          service_name: serviceResult.data?.name
        }
      });

    res.json({
      message: 'Service access revoked successfully'
    });
  } catch (error) {
    console.error('Revoke service access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;