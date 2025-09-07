import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/middleware/auth'
import { logger } from '@/utils/logger'
import { dbLogger } from '@/utils/db-logger'

const router = Router()

const addUserToServiceSchema = z.object({
  userId: z.string().uuid(),
  serviceId: z.string().uuid(),
  role: z.enum(['admin', 'user']),
})

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'user']),
})

// Apply auth middleware to all routes
router.use(authenticateRequest)

// POST /api/service-roles
router.post('/', async (req, res) => {
  try {
    const { userId, serviceId, role } = addUserToServiceSchema.parse(req.body)
    
    const { data: serviceData } = await supabaseAdmin.from('services').select('name').eq('id', serviceId).single();
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Rule: Non-admins cannot add users to the Administration service
    if (req.user?.role === 'user' && serviceData?.name === 'Administration') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage roles in the Administration service.' });
    }

    const { error } = await supabaseAdmin
      .from('service_roles')
      .insert({
        user_id: userId,
        service_id: serviceId,
        role,
      })

    if (error) {
      logger.error('Error adding user to service', { error, userId, serviceId, role })
      return res.status(400).json({ error: error.message })
    }

    // Audit log
    await dbLogger.log({
        actor: req.user!,
        action: 'service.add_user',
        target: { id: userId, email: userData.user?.email },
        details: { service: serviceData?.name, role },
    });

    res.status(201).json({ message: 'User added to service successfully' })
  } catch (error) {
    logger.error('Error in add user to service route', { error })
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors })
    }
    return res.status(500).json({ error: 'Failed to add user to service' })
  }
})

// DELETE /api/service-roles/:userId/:serviceId
router.delete('/:userId/:serviceId', async (req, res) => {
  try {
    const { userId, serviceId } = req.params
    
    const { data: serviceData } = await supabaseAdmin.from('services').select('name').eq('id', serviceId).single();
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Rule: Non-admins cannot remove users from the Administration service
    if (req.user?.role === 'user' && serviceData?.name === 'Administration') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage roles in the Administration service.' });
    }

    // Check if the target user is an Administration admin
    const { data: targetRoleData, error: targetRoleError } = await supabaseAdmin
      .from('service_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('service_id', serviceId)
      .single();

    if (targetRoleError) {
      logger.warn('Could not fetch target user role for deletion check', { userId, serviceId });
    }

    // Rule: Maintain a minimum of 2 admins for Administration service
    if (serviceData?.name === 'Administration' && targetRoleData?.role === 'admin') {
      const { count, error: countError } = await supabaseAdmin
        .from('service_roles')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('role', 'admin');

      if (countError) {
        logger.error('Could not count Administration admins for removal check', { error: countError });
        return res.status(500).json({ error: 'Could not verify admin count.' });
      }

      if (count !== null && count <= 2) {
        return res.status(403).json({ error: 'Cannot remove admin. A minimum of 2 admins for the Administration service is required.' });
      }
    }

    const { error } = await supabaseAdmin
      .from('service_roles')
      .delete()
      .eq('user_id', userId)
      .eq('service_id', serviceId)

    if (error) {
      logger.error('Error removing user from service', { error, userId, serviceId })
      return res.status(400).json({ error: error.message })
    }

    // Audit log
    await dbLogger.log({
      actor: req.user!,
      action: 'service.remove_user',
      target: { id: userId, email: userData.user?.email },
      details: { service: serviceData?.name },
    });

    res.json({ message: 'User removed from service successfully' })
  } catch (error) {
    logger.error('Error in remove user from service route', { error })
    return res.status(500).json({ error: 'Failed to remove user from service' })
  }
})

// PUT /api/service-roles/:userId/:serviceId
router.put('/:userId/:serviceId', async (req, res) => {
  try {
    const { userId, serviceId } = req.params
    const { role } = updateRoleSchema.parse(req.body)

    const { data: serviceData } = await supabaseAdmin.from('services').select('name').eq('id', serviceId).single();
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Rule: Non-admins cannot make themselves an admin in the Administration service
    if (req.user?.role === 'user' && serviceData?.name === 'Administration' && req.user.id === userId && role === 'admin') {
      return res.status(403).json({ error: 'Forbidden: You cannot make yourself an admin.' });
    }

    // Rule: Non-admins cannot update any roles in the Administration service
    if (req.user?.role === 'user' && serviceData?.name === 'Administration') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage roles in the Administration service.' });
    }
    
    // Rule: Admin cannot make himself a user in the Administration service
    if (req.user?.role === 'admin' && serviceData?.name === 'Administration' && req.user.id === userId && role === 'user') {
      return res.status(403).json({ error: 'Forbidden: Admins cannot demote their own account.' });
    }

    // Check if the target user is an Administration admin being demoted
    const { data: targetRoleData, error: targetRoleError } = await supabaseAdmin
      .from('service_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('service_id', serviceId)
      .single();

    if (targetRoleError) {
      logger.warn('Could not fetch target user role for demotion check', { userId, serviceId });
    }

    // Rule: Maintain a minimum of 2 admins when demoting an admin in Administration
    if (serviceData?.name === 'Administration' && targetRoleData?.role === 'admin' && role === 'user') {
      const { count, error: countError } = await supabaseAdmin
        .from('service_roles')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('role', 'admin');

      if (countError) {
        logger.error('Could not count Administration admins for demotion check', { error: countError });
        return res.status(500).json({ error: 'Could not verify admin count.' });
      }

      if (count !== null && count <= 2) {
        return res.status(403).json({ error: 'Cannot demote admin. A minimum of 2 admins for the Administration service is required.' });
      }
    }

    const { error } = await supabaseAdmin
      .from('service_roles')
      .update({ role })
      .eq('user_id', userId)
      .eq('service_id', serviceId)

    if (error) {
      logger.error('Error updating user role', { error, userId, serviceId, role })
      return res.status(400).json({ error: error.message })
    }

    // Audit log
    await dbLogger.log({
      actor: req.user!,
      action: 'service.update_role',
      target: { id: userId, email: userData.user?.email },
      details: { service: serviceData?.name, role: role },
    });

    res.json({ message: 'User role updated successfully' })
  } catch (error) {
    logger.error('Error in update user role route', { error })
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors })
    }
    return res.status(500).json({ error: 'Failed to update user role' })
  }
})

export { router as serviceRolesRouter }