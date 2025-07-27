import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, User, Shield, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useUsers } from '@/hooks/useUsers'
import { apiCall } from '@/lib/supabase'
import type { UserRole } from '@/types'

interface AddUserToServiceDialogProps {
  serviceId: string
  serviceName: string
  existingUserIds: string[]
  onUserAdded?: () => void
  triggerText?: string
  defaultRole?: UserRole
}

export default function AddUserToServiceDialog({ 
  serviceId, 
  serviceName, 
  existingUserIds, 
  onUserAdded,
  triggerText = "Add User",
  defaultRole = "user"
}: AddUserToServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [userSelectOpen, setUserSelectOpen] = useState(false)

  const { toast } = useToast()
  const { searchUsers } = useUsers()

  // Search users with debouncing
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const results = await searchUsers(searchTerm)
        // Filter out users who already have access
        const availableUsers = results.filter(user => !existingUserIds.includes(user.id))
        setSearchResults(availableUsers)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(searchUsersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, existingUserIds, searchUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please select a user and role.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      await apiCall(`/api/users/${selectedUserId}/services/${serviceId}/access`, {
        method: 'POST',
        body: JSON.stringify({ role: selectedRole })
      })

      const selectedUser = searchResults.find(u => u.id === selectedUserId)
      
      toast({
        title: "Access granted successfully",
        description: `${selectedUser?.full_name} has been granted ${selectedRole} access to ${serviceName}.`
      })
      
      setSelectedUserId('')
      setSelectedRole(defaultRole)
      setSearchTerm('')
      setSearchResults([])
      setOpen(false)
      onUserAdded?.()
    } catch (error: any) {
      console.error('Grant access error:', error)
      toast({
        title: "Error granting access",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = searchResults.find(u => u.id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={defaultRole === 'admin' ? 'default' : 'outline'}>
          <Plus className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Add User to {serviceName}
          </DialogTitle>
          <DialogDescription>
            Grant a user access to this service with the specified role.
          </DialogDescription>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* User Selection with Search */}
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
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searching ? "Searching..." : searchTerm ? "No users found." : "Start typing to search users..."}
                    </CommandEmpty>
                    {searchResults.length > 0 && (
                      <CommandGroup>
                        {searchResults.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.id}
                            onSelect={() => {
                              setSelectedUserId(user.id)
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

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User - Standard access
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin - Full access
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedUserId}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Granting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Grant Access
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}