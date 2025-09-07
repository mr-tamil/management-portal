'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateUser, useDeleteUser, useResetPassword, useBanUser } from '@/hooks/useUsers'
import { useServices, useUserServiceRoles, useAddUserToService, useRemoveUserFromService, useUpdateUserRole } from '@/hooks/useServices'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  User, 
  Edit, 
  AlertCircle, 
  Shield, 
  Database, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Key, 
  ShieldOff, 
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import type { UserWithRoles } from '@/types/database'
import { formatDate } from '@/utils/utils'

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
})

type EditUserForm = z.infer<typeof editUserSchema>

interface ManageUserDialogProps {
  user: UserWithRoles
  currentUserRole: 'admin' | 'user' | null
}

export function ManageUserDialog({ user, currentUserRole }: ManageUserDialogProps) {
  const [open, setOpen] = useState(false)
  
  const isUserBanned = (user: UserWithRoles) => {
    if (!user.banned_until) return false;
    if (user.banned_until === 'none') return true;
    return new Date(user.banned_until) > new Date();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div>Manage User</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="services"><Database className="h-4 w-4 mr-2" />Service Access</TabsTrigger>
            <TabsTrigger value="actions"><Shield className="h-4 w-4 mr-2" />Account Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="pt-6">
            <ProfileTab user={user} currentUserRole={currentUserRole} setOpen={setOpen} />
          </TabsContent>
          <TabsContent value="services" className="pt-6">
            <ServiceAccessTab user={user} />
          </TabsContent>
          <TabsContent value="actions" className="pt-6">
            <AccountActionsTab user={user} isBanned={isUserBanned(user)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Profile Tab Component
function ProfileTab({ user, currentUserRole, setOpen }: { user: UserWithRoles, currentUserRole: 'admin' | 'user' | null, setOpen: (open: boolean) => void }) {
  const updateUser = useUpdateUser()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: user.full_name || '' },
  })

  useEffect(() => {
    reset({ full_name: user.full_name || '' });
  }, [user, reset]);

  const onSubmit = async (data: EditUserForm) => {
    const result = await updateUser.mutateAsync({ userId: user.id, userData: data })
    if (!result.error) {
      setOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {currentUserRole === 'admin' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2"><User className="h-4 w-4" />Full Name</div>
              </label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter full name"
                disabled={updateUser.isPending}
                className="h-11"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.full_name.message}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
           <p className="text-sm text-muted-foreground">You do not have permission to edit user profiles.</p>
        )}
      </CardContent>
    </Card>
  )
}

// Service Access Tab Component
function ServiceAccessTab({ user }: { user: UserWithRoles }) {
  const [selectedService, setSelectedService] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user')

  const { data: servicesResponse } = useServices()
  const { data: userRolesResponse, isLoading: isLoadingUserRoles } = useUserServiceRoles(user.id)
  const addUserToService = useAddUserToService()
  const removeUserFromService = useRemoveUserFromService()
  const updateUserRole = useUpdateUserRole()

  const services = servicesResponse?.data || []
  const userRoles = userRolesResponse?.data || []

  const availableServices = services.filter(
    service => !userRoles.some(role => role.service_id === service.id)
  )

  const handleAddToService = async () => {
    if (!selectedService) return
    await addUserToService.mutateAsync({ userId: user.id, serviceId: selectedService, role: selectedRole })
    setSelectedService('')
    setSelectedRole('user')
  }

  const handleRemoveFromService = async (serviceId: string) => {
    await removeUserFromService.mutateAsync({ userId: user.id, serviceId })
  }

  const handleRoleChange = async (serviceId: string, newRole: 'admin' | 'user') => {
    await updateUserRole.mutateAsync({ userId: user.id, serviceId, role: newRole })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Current Service Access</CardTitle></CardHeader>
        <CardContent>
          {isLoadingUserRoles ? (
            <p>Loading service access...</p>
          ) : userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service access assigned.</p>
          ) : (
            <div className="space-y-3">
              {userRoles.map(role => {
                const service = services.find(s => s.id === role.service_id)
                return (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{service?.name}</p>
                      <p className="text-xs text-muted-foreground">Added {formatDate(role.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={role.role} onValueChange={(newRole: 'admin' | 'user') => handleRoleChange(role.service_id, newRole)} disabled={updateUserRole.isPending}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user"><div className="flex items-center gap-2"><User className="h-3 w-3" />User</div></SelectItem>
                          <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="h-3 w-3" />Admin</div></SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="icon" onClick={() => handleRemoveFromService(role.service_id)} disabled={removeUserFromService.isPending} className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {availableServices.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Add Service Access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>{availableServices.map(service => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={(role: 'admin' | 'user') => setSelectedRole(role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user"><div className="flex items-center gap-2"><User className="h-3 w-3" />User</div></SelectItem>
                  <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="h-3 w-3" />Admin</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddToService} disabled={!selectedService || addUserToService.isPending} className="w-full">
              <Plus className="h-4 w-4 mr-2" />Add Access
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Account Actions Tab Component
function AccountActionsTab({ user, isBanned }: { user: UserWithRoles; isBanned: boolean }) {
  const deleteUser = useDeleteUser()
  const resetPassword = useResetPassword()
  const banUser = useBanUser()

  const handleResetPassword = async () => {
    if (window.confirm(`Send password reset email to ${user.email}?`)) {
      await resetPassword.mutateAsync(user.id)
    }
  }

  const handleBanUser = async () => {
    const durationStr = window.prompt("Enter ban duration in days (leave empty for an indefinite ban):", "7");
    if (durationStr === null) return;
    const durationInDays = durationStr ? parseInt(durationStr, 10) : undefined;
    if (durationStr && (isNaN(durationInDays) || durationInDays <= 0)) {
      alert("Please enter a valid number of days.");
      return;
    }
    const confirmMessage = durationInDays 
      ? `Are you sure you want to ban user ${user.email} for ${durationInDays} days?`
      : `Are you sure you want to ban user ${user.email} indefinitely?`;
    if (window.confirm(confirmMessage)) {
      await banUser.mutateAsync({ userId: user.id, ban: true, durationInDays })
    }
  }

  const handleUnbanUser = async () => {
    if (window.confirm(`Are you sure you want to unban user ${user.email}?`)) {
      await banUser.mutateAsync({ userId: user.id, ban: false })
    }
  }

  const handleDeleteUser = async () => {
    if (window.confirm(`Are you sure you want to permanently delete user ${user.email}? This action cannot be undone.`)) {
      await deleteUser.mutateAsync(user.id)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Send Password Reset</p>
            <p className="text-xs text-muted-foreground">An email will be sent to the user with instructions.</p>
          </div>
          <Button variant="outline" onClick={handleResetPassword} disabled={resetPassword.isPending}>
            <Key className="h-4 w-4 mr-2" />Send Email
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{isBanned ? 'Unban User' : 'Ban User'}</p>
            <p className="text-xs text-muted-foreground">{isBanned ? 'Restore account access.' : 'Temporarily or permanently suspend account.'}</p>
          </div>
          {isBanned ? (
            <Button variant="outline" onClick={handleUnbanUser} disabled={banUser.isPending}>
              <ShieldCheck className="h-4 w-4 mr-2" />Unban
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBanUser} disabled={banUser.isPending}>
              <ShieldOff className="h-4 w-4 mr-2" />Ban
            </Button>
          )}
        </CardContent>
      </Card>
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete User</p>
              <p className="text-xs text-destructive/80">This action is permanent and cannot be undone.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteUser.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />Delete User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
