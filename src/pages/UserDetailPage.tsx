import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Calendar, Shield, Edit, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiCall } from '@/lib/supabase'
import type { UserWithRoles } from '@/hooks/useUsers'
import EditUserDialog from '@/components/users/EditUserDialog'
import DeactivateUserDialog from '@/components/users/DeactivateUserDialog'

export default function UserDetailPage() {
  const { id } = useParams()
  const [user, setUser] = useState<UserWithRoles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setError('No user ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const userData = await apiCall(`/api/users/${id}`)
        setUser(userData)
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError(err.message || 'Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [id]) // Only depend on id, not on getUser function

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error loading user</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button asChild className="mt-4">
            <Link to="/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="text-muted-foreground mt-2">The user you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link to="/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">User Details</h1>
          <p className="text-muted-foreground">
            Manage user information and service access.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditUserDialog 
              user={user} 
              onUserUpdated={() => window.location.reload()}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem>
              Reset Password
            </DropdownMenuItem>
            <DeactivateUserDialog 
              user={user} 
              onUserDeactivated={() => window.location.reload()}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  Deactivate User
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.full_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                {user.roles && user.roles.length > 0 ? user.roles.map((role, roleIndex) => (
                  <Badge
                    key={`${user.id}-${role}-${roleIndex}`}
                    variant={role === 'admin' ? 'default' : 'secondary'}
                  >
                    {role}
                  </Badge>
                )) : (
                  <Badge variant="outline">No roles assigned</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Last active: {new Date(user.last_active).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User ID: {user.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Services */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <CardTitle>Service Access</CardTitle>
              <CardDescription>
                Services this user has access to and their role in each service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.user_service_roles && user.user_service_roles.length > 0 ? (
                <div className="space-y-4">
                  {user.user_service_roles.map((serviceRole, index) => (
                    <motion.div
                      key={serviceRole.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{serviceRole.services?.name || 'Unknown Service'}</h3>
                        <p className="text-sm text-muted-foreground">{serviceRole.services?.description || 'No description available'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Granted: {new Date(serviceRole.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={serviceRole.role === 'admin' ? 'default' : 'secondary'}>
                          {serviceRole.role}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/services/${serviceRole.service_id}`}>
                            View Service
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">This user doesn't have access to any services yet.</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/users'}>
                    Manage Service Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions involving this user. <Link to="/activity" className="text-primary hover:underline">View all activity</Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.recent_activity && user.recent_activity.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {user.recent_activity.slice(0, 10).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border"
                    >
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        activity.activity_type === 'admin_action' ? 'bg-blue-500' :
                        activity.activity_type === 'service_access' ? 'bg-green-500' :
                        activity.activity_type === 'profile_update' ? 'bg-purple-500' :
                        activity.activity_type === 'login' ? 'bg-green-400' :
                        activity.activity_type === 'logout' ? 'bg-gray-400' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(activity.created_at).toLocaleString()}</span>
                          {activity.activity_type && (
                            <span className="px-2 py-1 bg-muted rounded-full">
                              {activity.activity_type.replace('_', ' ')}
                            </span>
                          )}
                          {activity.services && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              {activity.services.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {user.recent_activity && user.recent_activity.length > 10 && (
                    <div className="mb-4">
                      <Link to="/activity" className="text-primary hover:underline text-sm">
                        View all {user.recent_activity.length} activities →
                      </Link>
                    </div>
                  )}
                  <p>No recent activity found for this user.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}