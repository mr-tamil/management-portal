'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import type { CreateUserRequest, AuditLog, UserWithRoles, UpdateUserRequest } from '@/types/database'
import { toast } from 'sonner'

export function useUsers(page = 1, limit = 25, search = '', role = '', serviceId = '', status = '') {
  return useQuery({
    queryKey: ['users', page, limit, search, role, serviceId, status],
    queryFn: async () => {
      const result = await apiService.getUsers(page, limit, search, role, serviceId, status)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth errors
      if (failureCount >= 2) return false
      if (error.message.includes('Unauthorized')) return false
      return true
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useActivityLogs(page = 1, limit = 25) {
  return useQuery({
    queryKey: ['activity-logs', page, limit],
    queryFn: async () => {
      const result = await apiService.getLogs(page, limit)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      if (error.message.includes('Unauthorized')) return false
      return true
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useActivityLogsWithSearch(page = 1, limit = 25, search = '', actionFilter = '') {
  return useQuery({
    queryKey: ['activity-logs', page, limit, search, actionFilter],
    queryFn: async () => {
      const result = await apiService.getLogs(page, limit, search, actionFilter)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      if (error.message.includes('Unauthorized')) return false
      return true
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => apiService.createUser(userData),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('User created successfully')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to create user')
      console.error('Create user error:', error)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string, userData: UpdateUserRequest }) => 
      apiService.updateUser(userId, userData),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('User updated successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      }
    },
    onError: (error) => {
      toast.error('Failed to update user');
      console.error('Update user error:', error);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => apiService.deleteUser(userId),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('User deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to delete user')
      console.error('Delete user error:', error)
    },
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => apiService.resetUserPassword(userId),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('Password reset email sent')
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to send password reset')
      console.error('Reset password error:', error)
    },
  })
}

export function useBanUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, ban, durationInDays }: { userId: string, ban: boolean, durationInDays?: number }) => apiService.banUser(userId, ban, durationInDays),
    onSuccess: (response, { ban }) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        const action = ban ? 'banned' : 'unbanned'
        toast.success(`User ${action} successfully`)
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error, { ban }) => {
      const action = ban ? 'ban' : 'unban'
      toast.error(`Failed to ${action} user`)
      console.error(`Ban/unban user error:`, error)
    },
  })
}
