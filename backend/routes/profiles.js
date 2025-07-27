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

// Get all profiles (for app user management)
router.get('/', authenticateToken, checkAppAccess, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;