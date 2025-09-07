import { Router } from 'express'
import { authenticateRequest } from '../middleware/auth'

const router = Router()

router.get('/verify', authenticateRequest, (req, res) => {
  if (req.user) {
    res.json({ isMember: true, role: req.user.role })
  } else {
    res.json({ isMember: false })
  }
})

export { router as authRouter }