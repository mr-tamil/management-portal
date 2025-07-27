import { useState, useEffect } from 'react'
import { supabase, checkAppAccess, logActivity } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [appRole, setAppRole] = useState<'super_admin' | 'admin' | 'user' | null>(null)
  const [hasAppAccess, setHasAppAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
          await checkUserAppAccess()
        } else {
          // Clear state if no session
          setUser(null)
          setProfile(null)
          setAppRole(null)
          setHasAppAccess(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Clear state on error
        setUser(null)
        setProfile(null)
        setAppRole(null)
        setHasAppAccess(false)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialized) return // Wait for initial load to complete
        
        setLoading(true)
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
          await checkUserAppAccess()
          
          if (event === 'SIGNED_IN') {
            await logActivity('login', 'User signed in')
          }
        } else {
          if (event === 'SIGNED_OUT') {
            await logActivity('logout', 'User signed out')
          }
          setUser(null)
          setProfile(null)
          setAppRole(null)
          setHasAppAccess(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [initialized])

  // Handle visibility change to prevent loading state when returning to app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && hasAppAccess) {
        // App became visible and user is authenticated, no need to reload
        setLoading(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, hasAppAccess])

  // Handle focus events to prevent unnecessary loading
  useEffect(() => {
    const handleFocus = () => {
      if (user && hasAppAccess) {
        // User is authenticated and has access, no need to show loading
        setLoading(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, hasAppAccess])

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile directly from Supabase for auth purposes
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const checkUserAppAccess = async () => {
    try {
      const { hasAccess, userRole } = await checkAppAccess()
      setHasAppAccess(hasAccess)
      setAppRole(userRole)
      
      if (!hasAccess) {
        console.log('User does not have app access')
      }
    } catch (error) {
      console.error('Error checking app access:', error)
      setHasAppAccess(false)
      setAppRole(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in')

      // Update profile via Supabase directly for auth-related updates
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      setProfile(data)
      await logActivity('profile_update', 'Profile updated', undefined, { fields: Object.keys(updates) })
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }

  return {
    user,
    profile,
    appRole,
    hasAppAccess,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    checkUserAppAccess
  }
}