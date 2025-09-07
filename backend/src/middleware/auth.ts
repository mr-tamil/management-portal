import { Request, Response, NextFunction } from 'express'
import { supabaseClient, supabaseAdmin } from '@/lib/supabase'

export interface AuthenticatedUser {
  id: string
  email: string
  role?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user has access to Administration service
    const { data: serviceRoles, error: roleError } = await supabaseAdmin
      .from('service_roles')
      .select(`
        role,
        service:services(name)
      `)
      .eq('user_id', user.id)

    if (roleError) {
      console.error('Error checking user service roles:', roleError)
      return res.status(500).json({ error: 'Internal server error' })
    }

    const administrationRole = serviceRoles.find(
      (role: any) => role.service && role.service.name === 'Administration'
    )

    if (!administrationRole) {
      return res.status(403).json({ error: 'Access denied' })
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role: administrationRole.role,
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}