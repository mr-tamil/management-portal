import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/LoginForm'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'

function App() {
  const { user, loading, isMember, error } = useAuth()

  if (loading || (user && isMember === null)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const canShowDashboard = user && isMember

  return (
    <div className="min-h-screen">
      <Routes>
        <Route 
          path="/" 
          element={
            canShowDashboard ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <LoginForm initialError={error} />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App