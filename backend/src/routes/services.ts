import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateRequest } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()

// Apply auth middleware to all routes
router.use(authenticateRequest)

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('name')

    if (error) {
      logger.error('Error getting services', { error })
      return res.status(500).json({ error: 'Failed to get services' })
    }

    res.json({ data: services })
  } catch (error) {
    logger.error('Error in get services route', { error })
    return res.status(500).json({ error: 'Failed to get services' })
  }
})

export { router as servicesRouter }