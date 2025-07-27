// Mock data for the application
import type { Profile, Service, ServiceWithCounts, ActivityLog, ServiceMetric } from '@/types'

// Mock users/profiles
export const mockProfiles: Profile[] = [
  {
    id: 'user-1',
    full_name: 'Alice Johnson',
    email: 'alice.j@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T14:15:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-05-21T14:15:00Z'
  },
  {
    id: 'user-2',
    full_name: 'Bob Williams',
    email: 'bob.w@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T11:45:00Z',
    created_at: '2024-02-10T09:30:00Z',
    updated_at: '2024-05-21T11:45:00Z'
  },
  {
    id: 'user-3',
    full_name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-20T20:00:00Z',
    created_at: '2024-03-05T14:20:00Z',
    updated_at: '2024-05-20T20:00:00Z'
  },
  {
    id: 'user-4',
    full_name: 'Diana Prince',
    email: 'diana.p@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-18T09:30:00Z',
    created_at: '2024-01-20T11:15:00Z',
    updated_at: '2024-05-18T09:30:00Z'
  },
  {
    id: 'user-5',
    full_name: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    avatar_url: null,
    is_active: true,
    last_active: '2024-05-21T10:05:00Z',
    created_at: '2024-04-01T16:45:00Z',
    updated_at: '2024-05-21T10:05:00Z'
  }
]

// Mock services
export const mockServices: ServiceWithCounts[] = [
  {
    id: 'service-1',
    name: 'RMS Analysis',
    description: 'Service for analyzing retail management systems data.',
    status: 'active',
    config: { version: '1.0', environment: 'production' },
    metrics: {},
    created_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-05-15T14:30:00Z',
    adminCount: 2,
    userCount: 2,
    totalUsers: 4,
    admins: [mockProfiles[0], mockProfiles[3]], // Alice, Diana
    users: [mockProfiles[1], mockProfiles[2]]   // Bob, Charlie
  },
  {
    id: 'service-2',
    name: 'E-commerce Platform',
    description: 'Our primary online marketplace backend.',
    status: 'active',
    config: { version: '2.1', environment: 'production' },
    metrics: {},
    created_by: 'user-4',
    created_at: '2024-02-01T12:00:00Z',
    updated_at: '2024-05-20T16:45:00Z',
    adminCount: 1,
    userCount: 3,
    totalUsers: 4,
    admins: [mockProfiles[3]], // Diana
    users: [mockProfiles[2], mockProfiles[4], mockProfiles[1]] // Charlie, Ethan, Bob
  },
  {
    id: 'service-3',
    name: 'Mobile Game Backend',
    description: 'Backend services for the new mobile game.',
    status: 'active',
    config: { version: '1.5', environment: 'production' },
    metrics: {},
    created_by: 'user-1',
    created_at: '2024-03-01T09:15:00Z',
    updated_at: '2024-05-18T11:20:00Z',
    adminCount: 2,
    userCount: 1,
    totalUsers: 3,
    admins: [mockProfiles[0], mockProfiles[3]], // Alice, Diana
    users: [mockProfiles[4]] // Ethan
  }
]

// Mock activity logs
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'activity-1',
    user_id: 'user-1',
    service_id: 'service-1',
    activity_type: 'service_access',
    description: 'Accessed RMS Analysis service',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T14:15:00Z',
    profiles: mockProfiles[0],
    services: mockServices[0]
  },
  {
    id: 'activity-2',
    user_id: 'user-2',
    service_id: 'service-2',
    activity_type: 'admin_action',
    description: 'Updated service configuration',
    metadata: { action: 'config_update' },
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T13:30:00Z',
    profiles: mockProfiles[1],
    services: mockServices[1]
  },
  {
    id: 'activity-3',
    user_id: 'user-3',
    service_id: null,
    activity_type: 'profile_update',
    description: 'Updated profile information',
    metadata: { field: 'full_name' },
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T12:45:00Z',
    profiles: mockProfiles[2],
    services: null
  },
  {
    id: 'activity-4',
    user_id: 'user-4',
    service_id: 'service-3',
    activity_type: 'login',
    description: 'User signed in',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T11:20:00Z',
    profiles: mockProfiles[3],
    services: mockServices[2]
  },
  {
    id: 'activity-5',
    user_id: 'user-5',
    service_id: 'service-2',
    activity_type: 'service_access',
    description: 'Accessed E-commerce Platform',
    metadata: {},
    ip_address: null,
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-05-21T10:05:00Z',
    profiles: mockProfiles[4],
    services: mockServices[1]
  }
]

// Mock service metrics
export const mockServiceMetrics: ServiceMetric[] = [
  {
    id: 'metric-1',
    service_id: 'service-1',
    metric_name: 'uptime',
    metric_value: 99.9,
    metric_unit: 'percentage',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  },
  {
    id: 'metric-2',
    service_id: 'service-1',
    metric_name: 'response_time',
    metric_value: 120,
    metric_unit: 'milliseconds',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  },
  {
    id: 'metric-3',
    service_id: 'service-1',
    metric_name: 'error_rate',
    metric_value: 0.5,
    metric_unit: 'percentage',
    metadata: {},
    recorded_at: '2024-05-21T00:00:00Z'
  }
]

// Mock analytics data
export const mockAnalyticsData = {
  userGrowth: [
    { month: 'Jan', users: 65 },
    { month: 'Feb', users: 78 },
    { month: 'Mar', users: 92 },
    { month: 'Apr', users: 108 },
    { month: 'May', users: 125 },
    { month: 'Jun', users: 142 }
  ],
  serviceUsage: [
    { service: 'RMS Analysis', usage: 85 },
    { service: 'E-commerce Platform', usage: 92 },
    { service: 'Mobile Game Backend', usage: 78 }
  ],
  systemMetrics: [
    { name: 'Uptime', value: 99.9, color: '#10b981' },
    { name: 'Response Time', value: 85, color: '#3b82f6' },
    { name: 'Error Rate', value: 0.5, color: '#ef4444' }
  ],
  recentActivity: mockActivityLogs.slice(0, 5)
}

// Mock authentication
export const mockAuth = {
  // NOTE: Replace this with your Supabase authentication logic
  signIn: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple mock validation - accept any email/password combination
    if (email && password) {
      const user = mockProfiles.find(p => p.email === email) || mockProfiles[0]
      return { 
        data: { user: { id: user.id, email: user.email } }, 
        error: null 
      }
    }
    
    return { 
      data: null, 
      error: 'Invalid credentials' 
    }
  },
  
  signOut: async () => {
    // NOTE: Replace this with your Supabase sign out logic
    await new Promise(resolve => setTimeout(resolve, 500))
    return { error: null }
  },
  
  getUser: () => {
    // NOTE: Replace this with your Supabase user session logic
    const storedUser = localStorage.getItem('mockUser')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      return { data: { user: userData }, error: null }
    }
    return { data: { user: null }, error: null }
  },
  
  setUser: (user: any) => {
    // NOTE: This is for mock purposes only - remove when implementing Supabase
    localStorage.setItem('mockUser', JSON.stringify(user))
  },
  
  clearUser: () => {
    // NOTE: This is for mock purposes only - remove when implementing Supabase
    localStorage.removeItem('mockUser')
  }
}

// Helper functions for mock data operations
export const mockOperations = {
  // NOTE: Replace these with your Supabase database operations
  
  getServices: async (): Promise<ServiceWithCounts[]> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockServices
  },
  
  getService: async (id: string): Promise<ServiceWithCounts | null> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockServices.find(s => s.id === id) || null
  },
  
  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return mockProfiles.map(profile => ({
      ...profile,
      user_service_roles: [],
      roles: ['user'] // Mock role assignment
    }))
  },
  
  getUser: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const profile = mockProfiles.find(p => p.id === id)
    if (!profile) return null
    
    return {
      ...profile,
      user_service_roles: [],
      roles: ['user']
    }
  },
  
  getAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return mockAnalyticsData
  }
}