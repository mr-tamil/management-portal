import { motion } from 'framer-motion'
import { Server, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoginForm from './LoginForm'
import { useAuthContext } from './AuthProvider'

export default function AuthPage() {
  const { user, hasAppAccess, loading } = useAuthContext()

  // Show access denied if user is authenticated but doesn't have app access
  if (user && !loading && !hasAppAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-sm text-muted-foreground">Management Portal</p>
              </div>
            </div>
          </motion.div>

          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have access to this management portal. Please contact your administrator to request access.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold gradient-text">Service Dashboard</h1>
              <p className="text-sm text-muted-foreground">Management Portal</p>
            </div>
          </div>
        </motion.div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  )
}