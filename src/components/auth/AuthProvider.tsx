import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  appRole: 'super_admin' | 'admin' | 'user' | null
  hasAppAccess: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: string | null }>
  checkUserAppAccess: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}