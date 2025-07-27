import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Check if user is admin (legacy - kept for compatibility)
export const requireAdmin = async (req, res, next) => {
  try {
    const { data: appUser, error } = await supabase
      .from('app_users')
      .select('role, is_active')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error || !appUser) {
      return res.status(403).json({ error: 'No app access' });
    }

    if (!['super_admin', 'admin'].includes(appUser.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userRole = appUser.role;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify token endpoint
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    // Get user profile and app access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Check app access
    const { data: appUser, error: appError } = await supabase
      .from('app_users')
      .select('role, is_active')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (appError || !appUser) {
      return res.status(403).json({ error: 'No app access' });
    }

    res.json({ 
      user: req.user, 
      profile,
      appRole: appUser.role,
      hasAppAccess: true
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

export default router;