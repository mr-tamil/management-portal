import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Shield, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiCall } from '@/lib/supabase'
import type { ServiceWithCounts } from '@/types'
import AddUserToServiceDialog from '@/components/services/AddUserToServiceDialog'
import RemoveUserFromServiceDialog from '@/components/services/RemoveUserFromServiceDialog'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const [service, setService] = useState<ServiceWithCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      if (!id) {
        setError('No service ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const serviceData = await apiCall(`/api/services/${id}`)
        setService(serviceData)
      } catch (err: any) {
        console.error('Error fetching service:', err)
        setError(err.message || 'Failed to fetch service')
      } finally {
        setLoading(false)
      }
    }
    
    fetchService()
  }, [id]) // Only depend on id parameter

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
          <h2 className="text-2xl font-bold text-destructive">Error loading service</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button asChild className="mt-4">
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Service not found</h2>
          <p className="text-muted-foreground mt-2">The service you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link to="/">Back to Dashboard</Link>
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
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight gradient-text">{service.name}</h1>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      {/* Service Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-4"
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{service.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {service.adminCount} admin{service.adminCount !== 1 ? 's' : ''}, {service.userCount} user{service.userCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card glass-card-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-2 w-2 rounded-full ${
              service.status === 'active' ? 'bg-green-500' :
              service.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              service.status === 'active' ? 'text-green-600' :
              service.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {service.status === 'active' ? 'All systems operational' : 'Service status'}
            </p>
          </CardContent>
        </Card>

      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Service Admins */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Admins</CardTitle>
                  <CardDescription>
                    Users with administrative access to this service
                  </CardDescription>
                </div>
                <Button size="sm">
                  <AddUserToServiceDialog
                    serviceId={service.id}
                    serviceName={service.name}
                    existingUserIds={[...(service.admins?.map(a => a.id) || []), ...(service.users?.map(u => u.id) || [])]}
                    onUserAdded={() => window.location.reload()}
                    triggerText="Add Admin"
                    defaultRole="admin"
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {service.admins && service.admins.length > 0 ? service.admins.map((admin, index) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={admin.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {admin.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{admin.full_name}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Admin</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/users/${admin.id}`}>View</Link>
                        </Button>
                        {service.admins && service.admins.length > 1 && (
                          <RemoveUserFromServiceDialog
                            userId={admin.id}
                            userName={admin.full_name}
                            serviceId={service.id}
                            serviceName={service.name}
                            onUserRemoved={() => window.location.reload()}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                Remove
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No admins assigned to this service.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Users */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card glass-card-dark">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Users</CardTitle>
                  <CardDescription>
                    Users with access to this service
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <AddUserToServiceDialog
                    serviceId={service.id}
                    serviceName={service.name}
                    existingUserIds={[...(service.admins?.map(a => a.id) || []), ...(service.users?.map(u => u.id) || [])]}
                    onUserAdded={() => window.location.reload()}
                    triggerText="Add User"
                    defaultRole="user"
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {service.users && service.users.length > 0 ? service.users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                          {user.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">User</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/users/${user.id}`}>View</Link>
                        </Button>
                        <RemoveUserFromServiceDialog
                          userId={user.id}
                          userName={user.full_name}
                          serviceId={service.id}
                          serviceName={service.name}
                          onUserRemoved={() => window.location.reload()}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No users assigned to this service.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}