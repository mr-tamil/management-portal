import { useState, useEffect, useCallback } from 'react'
import { supabase, apiCall } from '@/lib/supabase'
import { logActivity } from '@/lib/supabase'
import type { ServiceWithCounts } from '@/types'

export const useServices = () => {
  const [services, setServices] = useState<ServiceWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const servicesWithCounts = await apiCall('/api/services')

      setServices(servicesWithCounts)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getService = useCallback(async (id: string): Promise<ServiceWithCounts | null> => {
    try {
      return await apiCall(`/api/services/${id}`)
    } catch (err: any) {
      console.error('Error fetching service:', err)
      throw new Error(err.message || 'Failed to fetch service')
    }
  }, [])

  const createService = useCallback(async (serviceData: {
    name: string
    description?: string
    config?: Record<string, any>
  }) => {
    try {
      const result = await apiCall('/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      })

      await logActivity(
        'admin_action',
        `Created new service: ${serviceData.name}`,
        result.service.id,
        { action: 'create_service' }
      )

      await fetchServices() // Refresh the list
      return { data: result.service, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [fetchServices])

  const updateService = useCallback(async (id: string, updates: any) => {
    try {
      const result = await apiCall(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      await logActivity(
        'admin_action',
        `Updated service: ${result.service.name}`,
        id,
        { action: 'update_service', fields: Object.keys(updates) }
      )

      await fetchServices() // Refresh the list
      return { data: result.service, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [fetchServices])

  const deleteService = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/services/${id}`, {
        method: 'DELETE'
      })

      await logActivity(
        'admin_action',
        `Deleted service`,
        id,
        { action: 'delete_service' }
      )

      await fetchServices() // Refresh the list
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [fetchServices])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    loading,
    error,
    fetchServices,
    getService,
    createService,
    updateService,
    deleteService
  }
}