'use client'

import type { 
  User, 
  UserWithRoles, 
  Service, 
  CreateUserRequest, 
  UpdateUserRequest,
  AddUserToServiceRequest,
  AuditLog,
  ApiResponse 
} from '@/types/database'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        let errorMessage = 'API request failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API Error:', error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  // User management
  async getUsers(page = 1, limit = 25, search = '', role = '', serviceId = '', status = ''): Promise<ApiResponse<{
    users: UserWithRoles[]
    total: number
    totalPages: number
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && { role }),
      ...(serviceId && { serviceId }),
      ...(status && { status }),
    })
    return this.request(`/users?${params}`)
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }
  
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async resetUserPassword(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
    })
  }

  async banUser(userId: string, banned: boolean, durationInDays?: number): Promise<ApiResponse<void>> {
    return this.request(`/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ banned, durationInDays }),
    })
  }

  // Service management
  async getServices(): Promise<ApiResponse<Service[]>> {
    return this.request('/services')
  }

  async getUserServiceRoles(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/users/${userId}/service-roles`)
  }

  async addUserToService(data: AddUserToServiceRequest): Promise<ApiResponse<void>> {
    return this.request('/service-roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async removeUserFromService(userId: string, serviceId: string): Promise<ApiResponse<void>> {
    return this.request(`/service-roles/${userId}/${serviceId}`, {
      method: 'DELETE',
    })
  }

  async updateUserRole(userId: string, serviceId: string, role: 'admin' | 'user'): Promise<ApiResponse<void>> {
    return this.request(`/service-roles/${userId}/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  }

  // Log management
  async getLogs(page = 1, limit = 25, search = '', actionFilter = ''): Promise<ApiResponse<{
    logs: AuditLog[]
    total: number
    totalPages: number
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(actionFilter && { action: actionFilter }),
    });
    return this.request(`/logs?${params}`);
  }

  // Auth verification
  async verifyAuth(): Promise<ApiResponse<{ isMember: boolean; role?: string }>> {
    return this.request('/auth/verify')
  }
}

export const apiService = new ApiService()