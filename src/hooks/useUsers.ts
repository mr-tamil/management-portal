import { useState, useEffect, useCallback } from 'react'
import { supabase, apiCall } from '@/lib/supabase'
import { logActivity } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

export type UserWithRoles = Profile & {
  user_service_roles: any[]
  roles: UserRole[]
  recent_activity?: any[]
}

interface CreateUserData {
  email: string
  full_name: string
  password: string
  role?: UserRole
}

interface UsersFilters {
  search?: string
  role?: string
  status?: 'active' | 'inactive' | 'all'
  page?: number
  limit?: number
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 50
  })

  const fetchUsers = useCallback(async (newFilters?: UsersFilters) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = { ...filters, ...newFilters }
      const queryParams = new URLSearchParams()
      
      if (currentFilters.search) queryParams.append('search', currentFilters.search)
      if (currentFilters.role && currentFilters.role !== 'all') queryParams.append('role', currentFilters.role)
      if (currentFilters.status && currentFilters.status !== 'all') queryParams.append('status', currentFilters.status)
      if (currentFilters.page) queryParams.append('page', currentFilters.page.toString())
      if (currentFilters.limit) queryParams.append('limit', currentFilters.limit.toString())

      const response = await apiCall(`/api/users?${queryParams.toString()}`)
      
      setUsers(response.users || [])
      setTotalUsers(response.total || 0)
      setFilters(currentFilters)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const searchUsers = useCallback(async (searchTerm: string) => {
    try {
      if (!searchTerm.trim()) {
        return []
      }

      const queryParams = new URLSearchParams()
      queryParams.append('search', searchTerm)
      queryParams.append('limit', '20') // Limit for search suggestions

      const response = await apiCall(`/api/users/search?${queryParams.toString()}`)
      return response.users || []
    } catch (err: any) {
      console.error('Error searching users:', err)
      return []
    }
  }, [])

  const getUser = useCallback(async (id: string): Promise<UserWithRoles | null> => {
    try {
      return await apiCall(`/api/users/${id}`)
    } catch (err: any) {
      console.error('Error fetching user:', err)
      throw new Error(err.message || 'Failed to fetch user')
    }
  }, [])

  const createUser = async (userData: CreateUserData) => {
    try {
      const result = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      if (result.user) {
        await logActivity(
          'admin_action',
          `Created new user: ${userData.full_name}`,
          undefined,
          { action: 'create_user', target_user_id: result.user.id }
        )

        await fetchUsers() // Refresh the list
        return { data: result.user, error: null }
      }

      return { data: null, error: 'Failed to create user profile' }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateUserProfile = async (id: string, updates: Partial<Profile>) => {
    try {
      const result = await apiCall(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      await logActivity(
        'admin_action',
        `Updated user profile: ${result.user.full_name}`,
        undefined,
        { action: 'update_user', target_user_id: id, fields: Object.keys(updates) }
      )

      await fetchUsers() // Refresh the list
      return { data: result.user, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      const result = await apiCall(`/api/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      })

      await logActivity(
        'admin_action',
        `${isActive ? 'Activated' : 'Deactivated'} user: ${result.user.full_name}`,
        undefined,
        { action: isActive ? 'activate_user' : 'deactivate_user', target_user_id: id }
      )

      await fetchUsers() // Refresh the list
      return { data: result.user, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deactivateUser = async (id: string) => {
    return toggleUserStatus(id, false)
  }

  const grantServiceAccess = async (
    userId: string,
    serviceId: string,
    role: UserRole
  ) => {
    try {
      const result = await apiCall(`/api/users/${userId}/services/${serviceId}/access`, {
        method: 'POST',
        body: JSON.stringify({ role })
      })

      await logActivity(
        'admin_action',
        `Granted ${role} access to service`,
        serviceId,
        { action: 'grant_service_access', target_user_id: userId, role }
      )

      await fetchUsers() // Refresh the list
      return { data: result, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const revokeServiceAccess = async (userId: string, serviceId: string) => {
    try {
      await apiCall(`/api/users/${userId}/services/${serviceId}/access`, {
        method: 'DELETE'
      })

      await logActivity(
        'admin_action',
        `Revoked service access`,
        serviceId,
        { action: 'revoke_service_access', target_user_id: userId }
      )

      await fetchUsers() // Refresh the list
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    totalUsers,
    loading,
    error,
    filters,
    fetchUsers,
    searchUsers,
    getUser,
    createUser,
    updateUserProfile,
    toggleUserStatus,
    deactivateUser,
    grantServiceAccess,
    revokeServiceAccess
  }
}