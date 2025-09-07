'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import type { AddUserToServiceRequest } from '@/types/database'
import { toast } from 'sonner'

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => apiService.getServices(),
  })
}

export function useUserServiceRoles(userId: string) {
  return useQuery({
    queryKey: ['user-service-roles', userId],
    queryFn: () => apiService.getUserServiceRoles(userId),
    enabled: !!userId,
  })
}

export function useAddUserToService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: AddUserToServiceRequest) => apiService.addUserToService(data),
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('User added to service successfully')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user-service-roles', variables.userId] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to add user to service')
      console.error('Add user to service error:', error)
    },
  })
}

export function useRemoveUserFromService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, serviceId }: { userId: string; serviceId: string }) => 
      apiService.removeUserFromService(userId, serviceId),
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('User removed from service')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user-service-roles', variables.userId] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to remove user from service')
      console.error('Remove user from service error:', error)
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, serviceId, role }: { 
      userId: string; 
      serviceId: string; 
      role: 'admin' | 'user' 
    }) => apiService.updateUserRole(userId, serviceId, role),
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('User role updated successfully')
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user-service-roles', variables.userId] })
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      }
    },
    onError: (error) => {
      toast.error('Failed to update user role')
      console.error('Update user role error:', error)
    },
  })
}
