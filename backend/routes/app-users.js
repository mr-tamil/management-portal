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

// Get all app users
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('app_users')
      .select(`
        *,
        profiles!app_users_user_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .order('granted_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get app users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new app user
router.post('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has super admin privileges
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ error: 'user_id and role are required' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get user details for logging
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        user_id,
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
        activity_type: 'admin_action',
        description: `Granted ${role} app access to ${targetUser?.full_name || 'user'}`,
        metadata: {
          action: 'grant_app_access',
          target_user_id: user_id,
          target_user_name: targetUser?.full_name,
          target_user_email: targetUser?.email,
          granted_role: role
        }
      });

    res.status(201).json({
      message: 'App user added successfully',
      data
    });
  } catch (error) {
    console.error('Add app user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update app user role
router.put('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has super admin privileges
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    // Get current app user details for logging
    const { data: currentAppUser } = await supabase
      .from('app_users')
      .select(`
        *,
        profiles!app_users_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('app_users')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    if (currentAppUser) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: req.user.id,
          activity_type: 'admin_action',
          description: `Updated ${currentAppUser.profiles.full_name}'s app role from ${currentAppUser.role} to ${role}`,
          metadata: {
            action: 'update_app_role',
            target_user_id: currentAppUser.user_id,
            target_user_name: currentAppUser.profiles.full_name,
            target_user_email: currentAppUser.profiles.email,
            old_role: currentAppUser.role,
            new_role: role
          }
        });
    }

    res.json({
      message: 'App user role updated successfully',
      data
    });
  } catch (error) {
    console.error('Update app user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove app user (deactivate)
router.delete('/:id', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has super admin privileges
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { id } = req.params;

    // Get the app user details before deletion for logging
    const { data: appUserToDelete, error: fetchError } = await supabase
      .from('app_users')
      .select(`
        *,
        profiles!app_users_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!appUserToDelete) {
      return res.status(404).json({ error: 'App user not found' });
    }

    // Actually delete the app user record (not just deactivate)
    const { error: deleteError } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        activity_type: 'admin_action',
        description: `Removed app access for ${appUserToDelete.profiles.full_name}`,
        metadata: {
          action: 'remove_app_user',
          target_user_id: appUserToDelete.user_id,
          target_user_name: appUserToDelete.profiles.full_name,
          target_user_email: appUserToDelete.profiles.email,
          removed_role: appUserToDelete.role
        }
      });

    res.json({
      message: 'App user removed successfully',
      data: appUserToDelete
    });
  } catch (error) {
    console.error('Remove app user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;