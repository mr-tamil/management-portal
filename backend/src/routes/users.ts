import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateRequest } from '../middleware/auth'
import { logger } from '../utils/logger'
import { dbLogger } from '../utils/db-logger'
import type { User } from '@supabase/supabase-js'

const router = Router()

// Extend the User type to include banned_until
interface ExtendedUser extends User {
  banned_until?: string | null
}

const createUserSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
})

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
})

const banUserSchema = z.object({
  banned: z.boolean(),
  durationInDays: z.number().optional(),
})

// Apply auth middleware to all routes
router.use(authenticateRequest)

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '25', search = '', role = '', serviceId = '', status = '' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = Math.min(parseInt(limit as string), 100)
    const offset = (pageNum - 1) * limitNum

    try {
      // Build pagination parameters for auth.admin.listUsers
      const authParams: any = {
        page: pageNum,
        perPage: Math.min(limitNum * 2, 1000), // Fetch more to account for filtering
      }

      const { data: authUsersResponse, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers(authParams)

      if (authUsersError) {
        logger.error('Error getting users from auth', { error: authUsersError })
        return res.status(500).json({ error: 'Failed to get users from authentication service' })
      }

      let allUsers = authUsersResponse.users as ExtendedUser[] || []

      // Apply search filter early to reduce dataset size
      if (search) {
        try {
          const searchLower = (search as string).toLowerCase()
          allUsers = allUsers.filter(u => 
            u.email?.toLowerCase().includes(searchLower) ||
            u.user_metadata?.full_name?.toLowerCase().includes(searchLower)
          )
        } catch (searchError) {
          logger.error('Error in search filtering', { error: searchError })
          return res.status(500).json({ error: 'Failed to apply search filter' })
        }
      }

      // Filter by role and service if provided
      if (role || serviceId) {
        try {
          if (role === 'none') {
            const { data: usersWithRoles, error: usersWithRolesError } = await supabaseAdmin
              .from('service_roles')
              .select('user_id');
            if (usersWithRolesError) {
              logger.error('Error getting user ids from service_roles', { error: usersWithRolesError });
              return res.status(500).json({ error: 'Failed to filter users by role' });
            }
            const userIdsWithRoles = new Set(usersWithRoles.map(u => u.user_id));
            allUsers = allUsers.filter(u => !userIdsWithRoles.has(u.id));
          } else {
            let serviceRolesQuery = supabaseAdmin.from('service_roles').select('user_id')
            if (role) {
              serviceRolesQuery = serviceRolesQuery.eq('role', role as string)
            }
            if (serviceId) {
              serviceRolesQuery = serviceRolesQuery.eq('service_id', serviceId as string)
            }

            const { data: roleUsers, error: roleUsersError } = await serviceRolesQuery
            if (roleUsersError) {
              logger.error('Error getting user ids from service_roles', { error: roleUsersError })
              return res.status(500).json({ error: 'Failed to filter users by role/service' })
            }

            const userIdsWithRole = new Set(roleUsers.map(u => u.user_id))
            allUsers = allUsers.filter(u => userIdsWithRole.has(u.id))
          }
        } catch (roleFilterError) {
          logger.error('Error in role/service filtering', { error: roleFilterError })
          return res.status(500).json({ error: 'Failed to apply role/service filters' })
        }
      }

      // Filter by status
      if (status) {
        try {
          const now = new Date();
          allUsers = allUsers.filter(u => {
            if (status === 'verified') return !!u.email_confirmed_at;
            if (status === 'not-verified') return !u.email_confirmed_at;
            if (status === 'banned') {
              return u.banned_until && (u.banned_until === 'none' || new Date(u.banned_until) > now);
            }
            return true;
          });
        } catch (statusFilterError) {
          logger.error('Error in status filtering', { error: statusFilterError })
          return res.status(500).json({ error: 'Failed to apply status filter' })
        }
      }

      const filteredUsers = allUsers
      const total = filteredUsers.length
      const paginatedUsers = filteredUsers.slice(offset, offset + limitNum)

      // Get service roles for each paginated user
      try {
        // Batch fetch service roles for all paginated users
        const userIds = paginatedUsers.map(u => u.id)
        const { data: allServiceRoles, error: serviceRolesError } = await supabaseAdmin
          .from('service_roles')
          .select(`
            id,
            user_id,
            role,
            created_at,
            service:services(id, name)
          `)
          .in('user_id', userIds)

        if (serviceRolesError) {
          logger.warn('Error getting service roles for users', { error: serviceRolesError })
        }

        // Group service roles by user_id for efficient lookup
        const serviceRolesByUser = (allServiceRoles || []).reduce((acc, role) => {
          if (!acc[role.user_id]) {
            acc[role.user_id] = []
          }
          acc[role.user_id].push(role)
          return acc
        }, {} as Record<string, any[]>)

        const usersWithRoles = paginatedUsers.map((user) => ({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          banned_until: user.banned_until,
          service_roles: serviceRolesByUser[user.id] || [],
        }))

        res.json({
          data: {
            users: usersWithRoles,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
          },
        })
      } catch (rolesError) {
        logger.error('Error getting service roles for users', { error: rolesError })
        return res.status(500).json({ error: 'Failed to get user service roles' })
      }
    } catch (authError) {
      logger.error('Error in authentication service', { error: authError })
      return res.status(500).json({ error: 'Authentication service unavailable' })
    }
  } catch (error) {
    logger.error('Unexpected error getting users', { error })
    return res.status(500).json({ error: 'An unexpected error occurred while fetching users' })
  }
})

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { username, email } = createUserSchema.parse(req.body)

    try {
      // Invite user by email
      const { data: newUser, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { data: { username, full_name: username } }
      )

      if (error) {
        logger.error('Error creating user invitation', { error, email })
        return res.status(400).json({ error: error.message })
      }

      // Audit Log
      try {
        await dbLogger.log({
          actor: req.user!,
          action: 'user.create',
          target: { id: newUser.user.id, email: newUser.user.email },
        });
      } catch (logError) {
        logger.warn('Failed to write audit log for user creation', { error: logError })
        // Don't fail the request if logging fails
      }

      res.status(201).json({
        data: {
          id: newUser.user.id,
          email: newUser.user.email,
          created_at: newUser.user.created_at,
        },
        message: 'User invitation sent successfully'
      })
    } catch (inviteError) {
      logger.error('Error in user invitation process', { error: inviteError, email })
      return res.status(500).json({ error: 'Failed to send user invitation' })
    }
  } catch (error) {
    logger.error('Unexpected error in create user route', { error })
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors })
    }
    return res.status(500).json({ error: 'An unexpected error occurred while creating user' })
  }
})

// PUT /api/users/:userId
router.put('/:userId', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to edit users.' })
    }

    const { userId } = req.params
    const validation = updateUserSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data', details: validation.error.errors })
    }

    const { full_name } = validation.data

    const { data: updatedUser, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name },
    })

    if (error) {
      logger.error('Error updating user', { error, userId })
      return res.status(400).json({ error: error.message })
    }

    // Audit Log
    await dbLogger.log({
      actor: req.user,
      action: 'user.update',
      target: { id: userId, email: updatedUser.user.email },
      details: { full_name },
    });

    res.json({
      data: updatedUser.user,
      message: 'User updated successfully'
    })
  } catch (error) {
    logger.error('Error in update user route', { error })
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors })
    }
    return res.status(500).json({ error: 'Failed to update user' })
  }
})

// DELETE /api/users/:userId
router.delete('/:userId', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete users.' })
    }

    const { userId } = req.params

    // Rule: Admin cannot delete himself
    if (req.user.id === userId) {
      return res.status(403).json({ error: 'Admins cannot delete their own account.' })
    }

    // Get Administration service ID
    const { data: administrationService, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('name', 'Administration')
      .single()

    if (serviceError || !administrationService) {
      logger.error('Could not find Administration service', { error: serviceError })
      return res.status(500).json({ error: 'Administration service not found.' })
    }

    // Check if the user to be deleted is an Administration admin
    const { data: targetRole, error: targetRoleError } = await supabaseAdmin
      .from('service_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('service_id', administrationService.id)
      .single()

    // If the user is an Administration admin, check the admin count
    if (!targetRoleError && targetRole?.role === 'admin') {
      const { count, error: countError } = await supabaseAdmin
        .from('service_roles')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', administrationService.id)
        .eq('role', 'admin')

      if (countError) {
        logger.error('Could not count Administration admins', { error: countError })
        return res.status(500).json({ error: 'Could not verify admin count.' })
      }

      // Rule: Maintain a minimum of 2 admins
      if (count !== null && count < 3) {
        return res.status(403).json({ error: 'Cannot delete admin. A minimum of 2 admins for the Administration service is required.' })
      }
    }

    // Get user email before deleting
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (getUserError) {
      // Log but proceed with deletion attempt anyway
      logger.warn('Could not fetch user data before deletion', { userId });
    }

    // Delete user from Supabase Auth (this will cascade delete service_roles)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      logger.error('Error deleting user', { error, userId })
      return res.status(400).json({ error: error.message })
    }

    // Audit Log
    if (userData?.user) {
        await dbLogger.log({
            actor: req.user,
            action: 'user.delete',
            target: { id: userId, email: userData.user.email },
        });
    }

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    logger.error('Error in delete user route', { error })
    return res.status(500).json({ error: 'Failed to delete user' })
  }
})

// POST /api/users/:userId/reset-password
router.post('/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params

    // Get user email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !userData.user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Send password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email!)

    if (error) {
      logger.error('Error sending password reset', { error, userId })
      return res.status(400).json({ error: error.message })
    }

    // Audit log
    await dbLogger.log({
        actor: req.user!,
        action: 'user.reset_password',
        target: { id: userId, email: userData.user.email },
    });

    res.json({ message: 'Password reset email sent successfully' })
  } catch (error) {
    logger.error('Error in reset password route', { error })
    return res.status(500).json({ error: 'Failed to send password reset email' })
  }
})

// POST /api/users/:userId/ban
router.post('/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Rule: User cannot ban themselves (applies to both admin and user)
    if (req.user?.id === userId) {
      return res.status(403).json({ error: 'You cannot ban your own account.' })
    }

    // Fetch the target user's roles
    const { data: targetServiceRoles, error: rolesError } = await supabaseAdmin
      .from('service_roles')
      .select('role, service:services!inner(name)')
      .eq('user_id', userId);

    if (rolesError) {
      logger.error('Error fetching target user roles', { error: rolesError.message, targetUserId: userId });
      return res.status(500).json({ error: 'Could not verify target user roles.' });
    }

    const isTargetAdministrationMember = targetServiceRoles?.some((r: any) => r.service?.name === 'Administration') || false;
    const targetAdministrationRole = targetServiceRoles?.find((r: any) => r.service?.name === 'Administration');

    // Role-based permission checks
    if (req.user?.role === 'admin') {
      // Rule: Admin cannot ban another Administration admin
      if (targetAdministrationRole?.role === 'admin') {
        return res.status(403).json({ error: 'Admins cannot ban other admins.' });
      }
    } else if (req.user?.role === 'user') {
      // Rule: User cannot ban any member of the Administration service
      if (isTargetAdministrationMember) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to ban members of the Administration service.' });
      }
    } else {
      // Should not happen if user.role is checked, but as a safeguard
      return res.status(403).json({ error: 'Forbidden: You do not have permission to ban users.' });
    }

    const { banned, durationInDays } = banUserSchema.parse(req.body)

    let ban_duration: string
    if (banned) {
      if (durationInDays && durationInDays > 0) {
        const durationInHours = durationInDays * 24;
        ban_duration = `${durationInHours}h`;
      } else {
        ban_duration = 'none' // 'none' for indefinite
      }
    } else {
      ban_duration = '0' // '0' to unban
    }

    const { data: updatedUser, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration }
    )

    if (error) {
      logger.error('Error updating user ban status', { error: error.message, userId, banned, ban_duration })
      return res.status(400).json({ error: error.message })
    }
    
    // Audit Log
    const action = banned ? 'user.ban' : 'user.unban';
    const durationText = durationInDays ? `${durationInDays} days` : 'Indefinite';
    await dbLogger.log({
        actor: req.user!,
        action: action,
        target: { id: userId, email: updatedUser.user?.email },
        details: banned ? { duration: durationText } : undefined
    });

    const successMessage = banned ? 'User banned successfully' : 'User unbanned successfully';
    res.json({ message: successMessage })
  } catch (error) {
    logger.error('Error in ban user route', { error })
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors })
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user ban status';
    return res.status(500).json({ error: errorMessage })
  }
})

// GET /api/users/:userId/service-roles
router.get('/:userId/service-roles', async (req, res) => {
  try {
    const { userId } = req.params

    const { data: serviceRoles, error } = await supabaseAdmin
      .from('service_roles')
      .select(`
        *,
        service:services(id, name)
      `)
      .eq('user_id', userId)

    if (error) {
      logger.error('Error getting user service roles', { error, userId })
      return res.status(500).json({ error: 'Failed to get user service roles' })
    }

    res.json({ data: serviceRoles })
  } catch (error) {
    logger.error('Error in get user service roles route', { error })
    return res.status(500).json({ error: 'Failed to get user service roles' })
  }
})

export { router as usersRouter }