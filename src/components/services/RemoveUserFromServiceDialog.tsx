import { useState } from 'react'
import { AlertTriangle, UserMinus } from 'lucide-react'
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
import { apiCall } from '@/lib/supabase'

interface RemoveUserFromServiceDialogProps {
  userId: string
  userName: string
  serviceId: string
  serviceName: string
  onUserRemoved?: () => void
  trigger?: React.ReactNode
}

export default function RemoveUserFromServiceDialog({ 
  userId, 
  userName, 
  serviceId, 
  serviceName, 
  onUserRemoved, 
  trigger 
}: RemoveUserFromServiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRemove = async () => {
    setLoading(true)

    try {
      await apiCall(`/api/users/${userId}/services/${serviceId}/access`, {
        method: 'DELETE'
      })
      
      toast({
        title: "Access revoked",
        description: `${userName} no longer has access to ${serviceName}.`
      })
      
      onUserRemoved?.()
    } catch (error: any) {
      console.error('Remove user error:', error)
      toast({
        title: "Error removing user",
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
            <UserMinus className="mr-2 h-4 w-4" />
            Remove Access
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Service Access
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{userName}</strong>'s access to <strong>{serviceName}</strong>?
            <p className="mt-2">
              They will no longer be able to access this service, but their account will remain active.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Removing...
              </>
            ) : (
              'Remove Access'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}