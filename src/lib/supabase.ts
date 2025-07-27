import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Frontend Supabase client - ONLY for authentication
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Backend API base URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Helper function to check app access via backend API
export const checkAppAccess = async (requiredRole: 'super_admin' | 'admin' | 'user' = 'user') => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      return { hasAccess: false, userRole: null, error: 'Not authenticated' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Access denied' }))
      return { hasAccess: false, userRole: null, error: errorData.error || 'Access denied' }
    }

    const data = await response.json()
    
    // Check if user has required role
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'user': 1
    }

    const userRoleLevel = roleHierarchy[data.appRole as keyof typeof roleHierarchy] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole]
    const hasAccess = userRoleLevel >= requiredRoleLevel

    return { 
      hasAccess, 
      userRole: data.appRole, 
      error: hasAccess ? null : 'Insufficient permissions' 
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { hasAccess: false, userRole: null, error: 'Request timeout' }
    }
    console.error('App access check error:', error)
    return { hasAccess: false, userRole: null, error: error.message || 'Failed to verify access' }
  }
}

// Helper function to make authenticated API calls to backend
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}



// Export backend URL for direct use
export { BACKEND_URL }

// Helper function to log user activities
export const logActivity = async (
  type: string,
  description: string,
  serviceId?: string,
  metadata?: Record<string, any>
) => {
  try {
    await apiCall('/api/activity', {
      method: 'POST',
      body: JSON.stringify({
        type,
        description,
        service_id: serviceId,
        metadata
      })
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to avoid breaking the main functionality
  }
}