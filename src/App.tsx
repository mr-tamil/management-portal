import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuthContext } from '@/components/auth/AuthProvider'
import AuthPage from '@/components/auth/AuthPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardPage from '@/pages/DashboardPage'
import UsersPage from '@/pages/UsersPage'
import UserDetailPage from '@/pages/UserDetailPage'
import ServiceDetailPage from '@/pages/ServiceDetailPage'
import AppUsersPage from '@/pages/AppUsersPage'
import ActivityLogsPage from '@/pages/ActivityLogsPage'

function AppContent() {
  const { user, hasAppAccess, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !hasAppAccess) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen">
      <DashboardLayout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardPage />
              </motion.div>
            } />
            <Route path="/users" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UsersPage />
              </motion.div>
            } />
            <Route path="/users/:id" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UserDetailPage />
              </motion.div>
            } />
            <Route path="/services/:id" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ServiceDetailPage />
              </motion.div>
            } />
            <Route path="/app-users" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AppUsersPage />
              </motion.div>
            } />
            <Route path="/activity" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ActivityLogsPage />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
      </DashboardLayout>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App