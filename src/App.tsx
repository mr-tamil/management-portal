import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useAuth, fetchUserRole, logout as authLogout } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UserManagementPage from './pages/users/UserManagementPage';

const queryClient = new QueryClient();

import MainLayout from './components/layout/MainLayout';

const ProtectedRoute = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (!user || !role || role === 'user') {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

const App = () => {
  const { setUserAndRole, setLoading, logout: clearAuthStore } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const role = await fetchUserRole();
          if (role === 'user') {
            toast.error("You don't have permission to access this system.");
            await authLogout(); // This will trigger another auth change to null
          } else {
            setUserAndRole(session.user, role);
          }
        } else {
          clearAuthStore();
        }
        setLoading(false);
      }
    );

    // Initial load check
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = await fetchUserRole();
        if (role === 'user') {
          await authLogout();
        } else {
          setUserAndRole(session.user, role);
        }
      } else {
        clearAuthStore();
      }
      setLoading(false);
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserAndRole, setLoading, clearAuthStore]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            {/* Other protected routes will go here */}
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
