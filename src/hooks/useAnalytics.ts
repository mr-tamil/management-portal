import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

export interface AnalyticsData {
  userGrowth: { month: string; users: number }[]
  serviceUsage: { service: string; usage: number }[]
  systemMetrics: { name: string; value: number; color: string }[]
  recentActivity: ActivityLog[]
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    serviceUsage: [],
    systemMetrics: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const analyticsData = await apiCall('/api/analytics')
      setAnalytics(analyticsData)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  }
}