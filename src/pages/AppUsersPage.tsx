import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCog, Plus, Search, MoreHorizontal, Shield, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiCall, logActivity } from '@/lib/supabase'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { useUsers } from '@/hooks/useUsers'

interface AppUser {
  id: string
  user_id: string
  role: 'super_admin' | 'admin' | 'user'
  granted_at: string
  is_active: boolean
  profiles: {
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export default function AppUsersPage() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user')
  const [addingUser, setAddingUser] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<any[]>([])
  const [userSelectOpen, setUserSelectOpen] = useState(false)

  const { toast } = useToast()
  const { appRole } = useAuthContext()
  const { searchUsers } = useUsers()

  const isSuperAdmin = appRole === 'super_admin'

  useEffect(() => {
    fetchAppUsers()
  }, [])

  // Search users for adding to app
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!userSearchTerm.trim()) {
        setUserSearchResults([])
        return
      }

      try {
        const results = await searchUsers(userSearchTerm)
        // Filter out users who already have app access
        const availableUsers = results.filter(user => 
          !appUsers.some(appUser => appUser.user_id === user.id)
        )
        setUserSearchResults(availableUsers)
      } catch (error) {
        console.error('Search error:', error)
        setUserSearchResults([])
      }
    }

    const timeoutId = setTimeout(searchUsersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearchTerm, appUsers, searchUsers])

  const fetchAppUsers = async () => {
    try {
      const data = await apiCall('/api/app-users')
      setAppUsers(data || [])
    } catch (error: any) {
      toast({
        title: "Error loading app users",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addAppUser = async () => {
    if (!selectedProfile || !selectedRole) return

    setAddingUser(true)
    try {
      await apiCall('/api/app-users', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedProfile,
          role: selectedRole
        })
      })

      const profile = userSearchResults.find(p => p.id === selectedProfile)
      await logActivity(
        'admin_action',
        `Granted ${selectedRole} access to ${profile?.full_name}`,
        undefined,
        { action: 'grant_app_access', target_user_id: selectedProfile, role: selectedRole }
      )

      toast({
        title: "User added successfully",
        description: `${profile?.full_name} has been granted ${selectedRole} access.`
      })

      setAddUserOpen(false)
      setSelectedProfile('')
      setSelectedRole('user')
      setUserSearchTerm('')
      setUserSearchResults([])
      fetchAppUsers()
    } catch (error: any) {
      toast({
        title: "Error adding user",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setAddingUser(false)
    }
  }

  const removeAppUser = async (appUserId: string, userName: string) => {
    try {
      await apiCall(`/api/app-users/${appUserId}`, {
        method: 'DELETE'
      })

      await logActivity(
        'admin_action',
        `Removed app access for ${userName}`,
        undefined,
        { action: 'revoke_app_access', target_user_id: appUserId }
      )

      toast({
        title: "User removed",
        description: `${userName} no longer has access to the app.`
      })

      fetchAppUsers()
    } catch (error: any) {
      toast({
        title: "Error removing user",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const updateUserRole = async (appUserId: string, newRole: 'admin' | 'user', userName: string) => {
    try {
      await apiCall(`/api/app-users/${appUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      })

      await logActivity(
        'admin_action',
        `Updated ${userName}'s role to ${newRole}`,
        undefined,
        { action: 'update_app_role', target_user_id: appUserId, new_role: newRole }
      )

      toast({
        title: "Role updated",
        description: `${userName}'s role has been updated to ${newRole}.`
      })

      fetchAppUsers()
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const filteredUsers = appUsers.filter(user =>
    user.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedUser = userSearchResults.find(u => u.id === selectedProfile)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">App Users</h1>
          <p className="text-muted-foreground">
            Manage users who have access to this management portal.
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add App User</DialogTitle>
                <DialogDescription>
                  Grant access to this management portal for an existing user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Popover open={userSelectOpen} onOpenChange={setUserSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSelectOpen}
                        className="w-full justify-between"
                      >
                        {selectedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedUser.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {selectedUser.full_name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.full_name}</span>
                          </div>
                        ) : (
                          "Search and select a user..."
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search users by name or email..."
                          value={userSearchTerm}
                          onValueChange={setUserSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {userSearchTerm ? "No users found." : "Start typing to search users..."}
                          </CommandEmpty>
                          {userSearchResults.length > 0 && (
                            <CommandGroup>
                              {userSearchResults.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id}
                                  onSelect={() => {
                                    setSelectedProfile(user.id)
                                    setUserSelectOpen(false)
                                  }}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">{user.full_name}</div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(value: 'admin' | 'user') => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User - Basic access</SelectItem>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addAppUser} disabled={!selectedProfile || addingUser}>
                    {addingUser ? 'Adding...' : 'Add User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search app users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              App Users ({loading ? '...' : filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Users who have access to this management portal and their roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Granted</TableHead>
                    {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((appUser, index) => (
                    <motion.tr
                      key={appUser.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={appUser.profiles.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {appUser.profiles.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{appUser.profiles.full_name}</div>
                            <div className="text-sm text-muted-foreground">{appUser.profiles.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(appUser.role)}>
                          <Shield className="mr-1 h-3 w-3" />
                          {appUser.role === 'super_admin' ? 'Full Access' : appUser.role === 'admin' ? 'Full Access' : 'Standard Access'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(appUser.granted_at).toLocaleDateString()}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {appUser.role !== 'super_admin' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateUserRole(
                                      appUser.id,
                                      appUser.role === 'admin' ? 'user' : 'admin',
                                      appUser.profiles.full_name
                                    )}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {appUser.role === 'admin' ? 'Make User' : 'Make Admin'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => removeAppUser(appUser.id, appUser.profiles.full_name)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Access
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total App Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : appUsers.length}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : appUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Admin users</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card glass-card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : appUsers.filter(u => u.role === 'user').length}
            </div>
            <p className="text-xs text-muted-foreground">Standard access</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}