export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      service_roles: {
        Row: {
          id: string
          user_id: string
          service_id: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          role: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          actor_id: string | null
          actor_email: string | null
          action: string
          target_id: string | null
          target_email: string | null
          details: Record<string, any> | null
        }
        Insert: {
          id?: string
          created_at?: string
          actor_id?: string | null
          actor_email?: string | null
          action: string
          target_id?: string | null
          target_email?: string | null
          details?: Record<string, any> | null
        }
      }
    }
  }
}

export interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  last_sign_in_at?: string
  banned_until?: string,
  user_metadata: {
    full_name?: string
  }
}

export interface UserWithRoles extends User {
  full_name?: string
  service_roles: Array<{
    id: string
    service: {
      id: string
      name: string
    }
    role: 'admin' | 'user'
    created_at: string
  }>
}

export interface Service {
  id: string
  name: string
  created_at: string
}

export interface ServiceRole {
  id: string
  user_id: string
  service_id: string
  role: 'admin' | 'user'
  created_at: string
  service: Service
}

export interface AuditLog {
  id: string
  created_at: string
  actor_id: string | null
  actor_email: string | null
  action: string
  target_id: string | null
  target_email: string | null
  details: {
    service?: string;
    role?: 'admin' | 'user';
    duration?: string;
    full_name?: string;
  } | null
}

export interface CreateUserRequest {
  username: string
  email: string
}

export interface UpdateUserRequest {
  full_name: string;
}

export interface AddUserToServiceRequest {
  userId: string
  serviceId: string
  role: 'admin' | 'user'
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}