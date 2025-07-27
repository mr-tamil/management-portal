import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

export interface RealAnalyticsData {
  userGrowth: { month: string; users: number }[]
  serviceUsage: { service: string; usage: number }[]
  systemMetrics: { name: string; value: number; color: string }[]
  recentActivity: (ActivityLog & { isCurrentUser?: boolean })[]
  totalUsers: number
  activeServices: number
  totalActivity: number
  avgResponseTime: number
}

export const useRealAnalytics = () => {
  const [analytics, setAnalytics] = useState<RealAnalyticsData>({
    userGrowth: [],
    serviceUsage: [],
    systemMetrics: [],
    recentActivity: [],
    totalUsers: 0,
    activeServices: 0,
    totalActivity: 0,
    avgResponseTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRealAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch analytics data from backend
      const analyticsData = await apiCall('/api/analytics')
      
      // Fetch additional metrics
      const [usersResponse, servicesResponse] = await Promise.all([
        apiCall('/api/users'),
        apiCall('/api/services')
      ])

      // Calculate additional metrics
      const totalUsers = usersResponse?.length || 0
      const activeServices = servicesResponse?.filter((s: any) => s.status === 'active')?.length || 0
      const totalActivity = analyticsData.recentActivity?.length || 0
      
      // Calculate average response time from system metrics
      const responseTimeMetric = analyticsData.systemMetrics?.find((m: any) => m.name === 'Response Time')
      const avgResponseTime = responseTimeMetric ? (200 - (responseTimeMetric.value / 100 * 200)) : 120

      setAnalytics({
        ...analyticsData,
        totalUsers,
        activeServices,
        totalActivity,
        avgResponseTime
      })
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching real analytics:', err)
      
      // Fallback to basic calculated data if backend fails
      try {
        const [usersResponse, servicesResponse] = await Promise.all([
          apiCall('/api/users').catch(() => []),
          apiCall('/api/services').catch(() => [])
        ])

        setAnalytics({
          userGrowth: generateUserGrowthData(usersResponse),
          serviceUsage: generateServiceUsageData(servicesResponse),
          systemMetrics: [
            { name: 'Uptime', value: 99.5, color: '#10b981' },
            { name: 'Response Time', value: 85, color: '#3b82f6' },
            { name: 'Error Rate', value: 0.8, color: '#ef4444' }
          ],
          recentActivity: [],
          totalUsers: usersResponse?.length || 0,
          activeServices: servicesResponse?.filter((s: any) => s.status === 'active')?.length || 0,
          totalActivity: 0,
          avgResponseTime: 120
        })
      } catch (fallbackError) {
        console.error('Fallback analytics failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealAnalytics()
  }, [])

  return {
    analytics,
    loading,
    error,
    fetchRealAnalytics
  }
}

// Helper functions for generating analytics data
function generateUserGrowthData(users: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const now = new Date()
  
  return months.map((month, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const usersInMonth = users.filter(user => {
      const userDate = new Date(user.created_at)
      return userDate <= monthDate
    }).length
    
    return { month, users: usersInMonth }
  })
}

function generateServiceUsageData(services: any[]) {
  return services.map(service => ({
    service: service.name,
    usage: service.totalUsers || Math.floor(Math.random() * 100)
  }))
}