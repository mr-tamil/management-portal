'use client'

import React, { useState, useMemo } from 'react'
import { useUsers, useDeleteUser, useResetPassword, useBanUser } from '@/src/hooks/useUsers'
import { useAuth } from '@/src/hooks/useAuth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent } from '@/src/components/ui/card'
import { ManageUserDialog } from './ManageUserDialog' // New component
import { formatDate } from '@/src/utils/utils'
import { 
  Search, 
  RefreshCw,
  Filter,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldOff,
} from 'lucide-react'
import { useServices } from '@/src/hooks/useServices'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { EnhancedPagination } from './EnhancedPagination'
import { debounce } from '@/src/utils/performance'
import { usePrefetchNextPage } from '@/src/hooks/useOptimizedQueries'
import type { UserWithRoles } from '@/src/types/database'

export function UsersTable() {
  const { role: currentUserRole } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: usersResponse, isLoading, error, refetch, isFetching } = useUsers(currentPage, 25, debouncedSearch, roleFilter, serviceFilter, statusFilter)
  const { data: servicesResponse } = useServices()
  
  // Debounce search
  React.useEffect(() => {
    const debouncedUpdate = debounce(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    
    debouncedUpdate()
  }, [search])

  const users: UserWithRoles[] = usersResponse?.data?.users || []
  const totalPages = usersResponse?.data?.totalPages || 1
  const total = usersResponse?.data?.total || 0
  const services = servicesResponse?.data || []

  // Prefetch next page for better UX
  usePrefetchNextPage(currentPage, totalPages, {
    search: debouncedSearch,
    role: roleFilter,
    serviceId: serviceFilter,
    status: statusFilter,
  })

  const isUserBanned = (user: UserWithRoles) => {
    if (!user.banned_until) return false;
    if (user.banned_until === 'none') return true;
    return new Date(user.banned_until) > new Date();
  }

  const getUserStatus = (user: UserWithRoles) => {
    if (isUserBanned(user)) return 'banned'
    if (!user.email_confirmed_at) return 'unverified'
    if (user.last_sign_in_at) return 'active'
    return 'invited'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive" className="text-xs"><ShieldOff className="h-3 w-3 mr-1" />Banned</Badge>
      case 'unverified':
        return <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'active':
        return <Badge variant="secondary" className="text-xs text-green-600 bg-green-50 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'invited':
        return <Badge variant="outline" className="text-xs text-blue-600 border-blue-300"><AlertCircle className="h-3 w-3 mr-1" />Invited</Badge>
      default:
        return null
    }
  }

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setServiceFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || roleFilter || serviceFilter || statusFilter

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive mb-2">Failed to Load Users</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There was an error loading the user data. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filters */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-muted">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base bg-background"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[search, roleFilter, serviceFilter, statusFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                  <Select onValueChange={(value) => {
                    setStatusFilter(value === 'all' ? '' : value)
                    setCurrentPage(1)
                  }} value={statusFilter || 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="not-verified">Unverified</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
                  <Select onValueChange={(value) => {
                    setRoleFilter(value === 'all' ? '' : value)
                    setCurrentPage(1)
                  }} value={roleFilter || 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="none">No Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Service</label>
                  <Select onValueChange={(value) => {
                    setServiceFilter(value === 'all' ? '' : value)
                    setCurrentPage(1)
                  }} value={serviceFilter || 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Showing {users.length} of {total} users</span>
          {hasActiveFilters && (
            <Badge variant="outline" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>
        <div className="text-xs">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Enhanced Users Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Services & Roles</TableHead>
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 25 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-28"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-muted rounded animate-pulse w-32 ml-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">No Users Found</h3>
                          <p className="text-sm text-muted-foreground">
                            {hasActiveFilters 
                              ? 'Try adjusting your search criteria or filters'
                              : 'Get started by creating your first user'
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const status = getUserStatus(user);
                    const banned = isUserBanned(user);
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                               <div className="font-medium text-foreground">{user.full_name || user.email}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.full_name ? user.email : `ID: ${user.id.slice(0, 8)}...`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(status)}
                            {banned && user.banned_until !== 'none' && (
                              <div className="text-xs text-muted-foreground">
                                Until: {formatDate(user.banned_until)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {user.service_roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">No services assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {user.service_roles.map((role) => (
                                  <Badge
                                    key={role.id}
                                    variant={role.role === 'admin' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {role.service.name}
                                    <span className="ml-1 opacity-70">({role.role})</span>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Created: {formatDate(user.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last login: {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <ManageUserDialog user={user} currentUserRole={currentUserRole} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      <EnhancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        itemsPerPage={25}
        onPageChange={setCurrentPage}
        isLoading={isLoading || isFetching}
      />
    </div>
  )
}
