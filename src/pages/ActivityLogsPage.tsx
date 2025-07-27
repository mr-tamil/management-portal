import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Search, Filter, Calendar, User, Server, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiCall } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

interface ActivityFilters {
  search: string
  activityType: string
  dateRange: string
  page: number
  limit: number
}

export default function ActivityLogsPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    activityType: 'all',
    dateRange: 'all',
    page: 1,
    limit: 100
  })

  const fetchActivities = async (newFilters?: Partial<ActivityFilters>) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = { ...filters, ...newFilters }
      const queryParams = new URLSearchParams()
      
      if (currentFilters.search) queryParams.append('search', currentFilters.search)
      if (currentFilters.activityType !== 'all') queryParams.append('type', currentFilters.activityType)
      if (currentFilters.dateRange !== 'all') queryParams.append('dateRange', currentFilters.dateRange)
      queryParams.append('page', currentFilters.page.toString())
      queryParams.append('limit', currentFilters.limit.toString())

      const response = await apiCall(`/api/activity?${queryParams.toString()}`)
      
      setActivities(response.activities || [])
      setTotalCount(response.total || 0)
      setFilters(currentFilters)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleSearch = (value: string) => {
    fetchActivities({ search: value, page: 1 })
  }

  const handleFilterChange = (key: keyof ActivityFilters, value: string | number) => {
    fetchActivities({ [key]: value, page: 1 })
  }

  const handlePageChange = (page: number) => {
    fetchActivities({ page })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return '🔐'
      case 'logout': return '🚪'
      case 'service_access': return '🔧'
      case 'profile_update': return '👤'
      case 'admin_action': return '⚡'
      default: return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-green-500'
      case 'logout': return 'bg-gray-500'
      case 'service_access': return 'bg-blue-500'
      case 'profile_update': return 'bg-purple-500'
      case 'admin_action': return 'bg-orange-500'
      default: return 'bg-gray-400'
    }
  }

  const totalPages = Math.ceil(totalCount / filters.limit)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor all system activities and user actions across services.
          </p>
        </div>
        <Button onClick={() => fetchActivities()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.activityType} onValueChange={(value) => handleFilterChange('activityType', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="service_access">Service Access</SelectItem>
            <SelectItem value="profile_update">Profile Update</SelectItem>
            <SelectItem value="admin_action">Admin Action</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Activity Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Logs ({loading ? '...' : totalCount.toLocaleString()})
                </CardTitle>
                <CardDescription>
                  {loading ? 'Loading activities...' : `Showing ${activities.length} of ${totalCount.toLocaleString()} activities`}
                </CardDescription>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {filters.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading activities: {error}</p>
                <Button onClick={() => fetchActivities()} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activities found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * Math.min(index, 10) }}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className={`h-3 w-3 rounded-full mt-2 ${getActivityColor(activity.activity_type)}`} />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type.replace('_', ' ')}
                        </Badge>
                        {activity.services && (
                          <Badge variant="secondary" className="text-xs">
                            <Server className="mr-1 h-3 w-3" />
                            {activity.services.name}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium leading-tight">{activity.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.profiles?.full_name || 'System'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(activity.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {activity.profiles && (
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={activity.profiles.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {activity.profiles.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            onClick={() => handlePageChange(1)}
            disabled={filters.page === 1 || loading}
          >
            First
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i
              if (page > totalPages) return null
              
              return (
                <Button
                  key={page}
                  variant={page === filters.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(totalPages)}
            disabled={filters.page === totalPages || loading}
          >
            Last
          </Button>
        </motion.div>
      )}
    </div>
  )
}