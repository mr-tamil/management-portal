import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row'] & {
  user_service_roles?: UserServiceRole[]
  admins?: Profile[]
  users?: Profile[]
}
export type UserServiceRole = Database['public']['Tables']['user_service_roles']['Row'] & {
  profiles?: Profile
  services?: Service
}
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'] & {
  profiles?: Profile
  services?: Service
}
export type ServiceMetric = Database['public']['Tables']['service_metrics']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type ServiceStatus = Database['public']['Enums']['service_status']
export type ActivityType = Database['public']['Enums']['activity_type']

// Legacy types for backward compatibility
export type Role = 'Admin' | 'User'
export type User = Profile & {
  roles: Role[]
  lastActive: string
}

// Helper function to convert database types to legacy types
export const convertProfileToUser = (profile: Profile, roles: UserRole[] = []): User => ({
  ...profile,
  name: profile.full_name,
  roles: roles.map(role => role === 'admin' ? 'Admin' : 'User') as Role[],
  lastActive: new Date(profile.last_active).toLocaleString()
})

// Service with user counts
export type ServiceWithCounts = Service & {
  adminCount: number
  userCount: number
  totalUsers: number
}