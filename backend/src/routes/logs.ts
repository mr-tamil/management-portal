import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateRequest } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()

// Apply auth middleware to all routes
router.use(authenticateRequest)

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '25', search = '', action = '' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = Math.min(parseInt(limit as string), 100)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      const searchTerm = search as string
      query = query.or(`actor_email.ilike.%${searchTerm}%,target_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`)
    }

    // Apply action filter
    if (action) {
      query = query.eq('action', action as string)
    }

    const { data: logs, error, count } = await query
      .range(offset, offset + limitNum - 1)

    if (error) {
      logger.error('Error getting audit logs', { error })
      return res.status(500).json({ error: 'Failed to get audit logs' })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limitNum)

    res.json({
      data: {
        logs: logs || [],
        total,
        totalPages,
        currentPage: pageNum,
      },
    })
  } catch (error) {
    logger.error('Error in get logs route', { error })
    return res.status(500).json({ error: 'Failed to get audit logs' })
  }
})

export { router as logsRouter }