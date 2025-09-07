'use client'

import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'

// Optimized hook for dashboard stats that doesn't fetch full user data
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch minimal data for stats calculation
      const result = await apiService.getUsers(1, 1, '', '', '', '')
      if (result.error) {
        throw new Error(result.error)
      }
      
      // Return just the total count and basic stats
      return {
        totalUsers: result.data?.total || 0,
        // We'll calculate other stats server-side in the future
      }
    },
    staleTime: 60000, // 1 minute - stats don't need to be real-time
    refetchInterval: 300000, // Refetch every 5 minutes
  })
}

// Optimized hook for user search with caching
export function useUserSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['user-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return { users: [], total: 0 }
      }
      
      const result = await apiService.getUsers(1, 10, searchTerm)
      if (result.error) {
        throw new Error(result.error)
      }
      
      return {
        users: result.data?.users || [],
        total: result.data?.total || 0,
      }
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000, // 30 seconds
  })
}

// Prefetch next page for better UX
export function usePrefetchNextPage(currentPage: number, totalPages: number, filters: Record<string, any>) {
  const queryClient = useQueryClient()
  
  React.useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1
      
      // Determine if this is for users or activity logs based on filters
      if ('role' in filters || 'serviceId' in filters || 'status' in filters) {
        // Users prefetch
        queryClient.prefetchQuery({
          queryKey: ['users', nextPage, 25, filters.search, filters.role, filters.serviceId, filters.status],
          queryFn: () => apiService.getUsers(nextPage, 25, filters.search, filters.role, filters.serviceId, filters.status),
          staleTime: 30000,
        })
      } else if ('action' in filters) {
        // Activity logs prefetch
        queryClient.prefetchQuery({
          queryKey: ['activity-logs', nextPage, 25, filters.search, filters.action],
          queryFn: () => apiService.getLogs(nextPage, 25, filters.search, filters.action),
          staleTime: 30000,
        })
      }
    }
  }, [currentPage, totalPages, filters, queryClient])
}
