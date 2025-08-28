import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Re-defining the types here as they are not yet in types.ts
export type UserRole = 'user' | 'admin' | 'super_admin';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUserAndRole: (user: User | null, role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setUserAndRole: (user, role) => set({ user, role, session: supabase.auth.getSession() ? (supabase.auth.getSession() as unknown as Session) : null }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ session: null, user: null, role: null }),
}));

export const useAuth = useAuthStore;

// Standalone functions to be called from components
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // After login, we need to fetch the role.
  // The onAuthStateChange listener in App.tsx will handle this.
  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
  // The onAuthStateChange listener in App.tsx will clear the store.
};

export const fetchUserRole = async (): Promise<UserRole | null> => {
    const { data, error } = await supabase.rpc('get_current_user_role');
    if (error) {
      console.error('Error fetching user role:', error);
      // It's possible a user exists in auth but not in our public users table yet
      return null;
    }
    return data as UserRole;
};
