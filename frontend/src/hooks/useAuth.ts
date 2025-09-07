'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  role: 'admin' | 'user' | null
  isMember: boolean | null // null when unchecked, true/false after check
  loading: boolean
  error: string | null
}

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isMember: null,
    loading: true,
    error: null,
  })

  const verifyMembership = useCallback(async (token: string) => {
    try {
      console.log('Verifying membership with token:', token.substring(0, 20) + '...')
      
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Membership verification response:', response.status, response.statusText)
      
      if (response.ok) {
        const { isMember, role } = await response.json();
        console.log('Membership verification result:', { isMember, role })
        
        setAuthState(prev => ({ ...prev, isMember, role }));
        
        if (!isMember) {
          // If not a member, set error and sign out
          console.log('User is not a member, signing out')
          setAuthState(prev => ({ 
            ...prev, 
            error: 'You are not authorized to access this application.' 
          }));
          supabase.auth.signOut();
        }
        return isMember;
      } else {
        console.log('Membership verification failed with status:', response.status)
        const errorText = await response.text();
        console.log('Error response:', errorText)
        
        setAuthState(prev => ({ ...prev, isMember: false, role: null }));
        return false;
      }
    } catch (error) {
      console.error('Failed to verify membership:', error);
      setAuthState(prev => ({ ...prev, isMember: false, role: null }));
      return false;
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      console.log('Checking initial session...')
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Initial session check:', { session: !!session, user: !!session?.user, error })
      
      setAuthState(prev => ({ ...prev, user: session?.user ?? null }));
      
      if (session?.access_token) {
        console.log('Found access token, storing and verifying membership')
        localStorage.setItem('supabase.auth.token', session.access_token);
        await verifyMembership(session.access_token);
      } else {
        console.log('No access token found')
        localStorage.removeItem('supabase.auth.token');
        setAuthState(prev => ({ ...prev, isMember: false, role: null }));
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
    };

    checkSession();

    console.log('Setting up auth state change listener...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, { session: !!session, user: !!session?.user })
        
        setAuthState(prev => ({ ...prev, user: session?.user ?? null, loading: true }));
        
        if (session?.access_token) {
          console.log('New session with access token, storing and verifying')
          localStorage.setItem('supabase.auth.token', session.access_token);
          
          if (event === 'SIGNED_IN') {
            console.log('User signed in, verifying membership')
            await verifyMembership(session.access_token);
          }
        } else {
          console.log('No access token in new session')
          localStorage.removeItem('supabase.auth.token');
          setAuthState(prev => ({ ...prev, isMember: false, role: null }));
        }
        
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    );

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe();
    }
  }, [verifyMembership]);

  const signIn = async (email: string, password: string) => {
    console.log('SignIn called with email:', email)
    
    // Clear previous errors on new sign-in attempt
    setAuthState(prev => ({ ...prev, error: null }));
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Supabase signIn response:', { data: !!data, error })
    
    if (error) {
      console.error('SignIn error:', error)
      throw error;
    }
    
    console.log('SignIn successful, returning data')
    return data;
  };

  const signOut = async () => {
    console.log('SignOut called')
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('SignOut error:', error)
      throw error;
    }
    console.log('SignOut successful')
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
}