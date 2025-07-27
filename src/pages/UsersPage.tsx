import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useUsers } from '@/hooks/useUsers'
import AddUserDialog from '@/components/users/AddUserDialog'
import EditUserDialog from '@/components/users/EditUserDialog'
import DeactivateUserDialog from '@/components/users/DeactivateUserDialog'
import { useToast } from '@/hooks/use-toast'

export default function UsersPage() {
  const { users, totalUsers, loading, error, filters, fetchUsers, toggleUserStatus } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const { toast } = useToast()

  // Debounced search
  const debouncedSearch = useCallback((term: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      fetchUsers({
        search: term,
        role: selectedRole,
        status: selectedStatus,
        page: 1,
        limit: 50
      })
      setCurrentPage(1)
    }, 500)
    
    setSearchTimeout(timeout)
  }, [searchTimeout, selectedRole, selectedStatus, fetchUsers])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    fetchUsers({
      search: searchTerm,
      role,
      status: selectedStatus,
      page: 1,
      limit: 50
    })
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    fetchUsers({
      search: searchTerm,
      role: selectedRole,
      status,
      page: 1,
      limit: 50
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchUsers({
      search: searchTerm,
      role: selectedRole,
      status: selectedStatus,
      page,
      limit: 50
    })
  }

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await toggleUserStatus(userId, !currentStatus)
      if (error) {
        toast({
          title: "Error updating user status",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "User status updated",
          description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}.`
        })
      }
    } catch (error: any) {
      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedRole('all')
    setSelectedStatus('all')
    setCurrentPage(1)
    fetchUsers({
      search: '',
      role: 'all',
      status: 'all',
      page: 1,
      limit: 50
    })
  }

  const totalPages = Math.ceil(totalUsers / 50)

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error loading users</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => fetchUsers()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions across all services.
          </p>
        </div>
        <AddUserDialog onUserAdded={() => fetchUsers()} />
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
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="none">No Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users ({loading ? '...' : totalUsers.toLocaleString()})</CardTitle>
                <CardDescription>
                  {loading ? 'Loading users...' : `Showing ${users.length} of ${totalUsers.toLocaleString()} users`}
                </CardDescription>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
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
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found matching your criteria.</p>
                <Button onClick={resetFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {user.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            <Badge
                              variant={user.roles.includes('admin') ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {user.roles.includes('admin') ? 'Admin' : 'User'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              No roles
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">{user.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.last_active).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/users/${user.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <EditUserDialog 
                              user={user} 
                              onUserUpdated={() => fetchUsers()}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                              }
                            />
                            <DeactivateUserDialog 
                              user={user} 
                              onUserDeactivated={() => fetchUsers()}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
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
            disabled={currentPage === 1 || loading}
          >
            First
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              if (page > totalPages) return null
              
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
          >
            Last
          </Button>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all services</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : users.filter(u => u.is_active).length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : users.filter(u => u.roles?.includes('admin')).length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">With admin privileges</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}