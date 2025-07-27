import { useState } from 'react'
import { AlertTriangle, UserX } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useUsers } from '@/hooks/useUsers'
import type { UserWithRoles } from '@/hooks/useUsers'

interface DeactivateUserDialogProps {
  user: UserWithRoles
  onUserDeactivated?: () => void
  trigger?: React.ReactNode
}

export default function DeactivateUserDialog({ user, onUserDeactivated, trigger }: DeactivateUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { deactivateUser } = useUsers()

  const handleDeactivate = async () => {
    setLoading(true)

    try {
      const { error } = await deactivateUser(user.id)
      
      if (error) {
        toast({
          title: "Error deactivating user",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "User deactivated",
          description: `${user.full_name} has been deactivated successfully.`
        })
        
        onUserDeactivated?.()
      }
    } catch (error: any) {
      console.error('User deactivation error:', error)
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <UserX className="mr-2 h-4 w-4" />
            Deactivate User
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deactivate User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate <strong>{user.full_name}</strong>? 
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Prevent them from logging in</li>
              <li>Remove access to all services</li>
              <li>Keep their data for audit purposes</li>
            </ul>
            <p className="mt-2 text-sm">
              You can reactivate this user later if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deactivating...
              </>
            ) : (
              'Deactivate User'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}