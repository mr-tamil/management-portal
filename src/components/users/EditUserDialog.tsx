import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, User, Mail, Save, Key } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import type { UserWithRoles } from '@/hooks/useUsers'

interface EditUserDialogProps {
  user: UserWithRoles
  onUserUpdated?: () => void
  trigger?: React.ReactNode
}

export default function EditUserDialog({ user, onUserUpdated, trigger }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    is_active: user.is_active
  })

  const { toast } = useToast()
  const { updateUserProfile } = useUsers()

  // Reset form when user changes
  useEffect(() => {
    setFormData({
      full_name: user.full_name,
      is_active: user.is_active
    })
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive"
      })
      return
    }

    // Check if anything changed
    const hasChanges = 
      formData.full_name !== user.full_name ||
      formData.is_active !== user.is_active

    if (!hasChanges) {
      toast({
        title: "No changes detected",
        description: "Please make some changes before saving."
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await updateUserProfile(user.id, formData)
      
      if (error) {
        toast({
          title: "Error updating user",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "User updated successfully",
          description: `${formData.full_name}'s information has been updated.`
        })
        
        setOpen(false)
        onUserUpdated?.()
      }
    } catch (error: any) {
      console.error('User update error:', error)
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleResetPassword = async () => {
    setResetPasswordLoading(true)
    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email
      })

      if (error) {
        toast({
          title: "Error sending reset email",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Password reset email sent",
          description: `A password reset link has been sent to ${user.email}.`
        })
      }
    } catch (error: any) {
      toast({
        title: "Error sending reset email",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setResetPasswordLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information and account status.
          </DialogDescription>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>


          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active ? 'Account is active' : 'Account is deactivated'}
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          {/* User Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>User ID:</strong> {user.id.slice(0, 8)}...
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Last Active:</strong> {new Date(user.last_active).toLocaleDateString()}
            </p>
          </div>

          {/* Reset Password */}
          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={resetPasswordLoading}>
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send a password reset email to <strong>{user.email}</strong>. 
                    The user will receive an email with instructions to reset their password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPassword} disabled={resetPasswordLoading}>
                    {resetPasswordLoading ? 'Sending...' : 'Send Reset Email'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}