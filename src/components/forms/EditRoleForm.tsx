import { useForm } from 'react-hook-form';
import { useUpdateUserRole } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, UserRole } from '../../lib/types';
import { toast } from 'react-hot-toast';

interface EditRoleFormProps {
  user: UserProfile;
  onSuccess: () => void;
}

const EditRoleForm = ({ user, onSuccess }: EditRoleFormProps) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      role: user.role,
    }
  });
  const updateUserRoleMutation = useUpdateUserRole();
  const { role: currentUserRole } = useAuth();

  const onSubmit = async (data: { role: UserRole }) => {
    if (data.role === user.role) {
        toast.error("The new role is the same as the current role.");
        return;
    }
    updateUserRoleMutation.mutate({ userId: user.id, role: data.role }, {
      onSuccess: () => {
        toast.success(`User "${user.username}" role updated to ${data.role}.`);
        onSuccess();
      },
      onError: (err) => {
        toast.error(`Failed to update role: ${err.message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <p className="text-gray-400">
          Editing role for <span className="font-semibold text-white">{user.username}</span>
        </p>
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-400 mb-1">Role</label>
        <select
          id="role"
          {...register('role')}
          className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {/* An admin can only manage (demote) users to 'user' role. A super_admin can do anything */}
          <option value="user">User</option>
          {currentUserRole === 'super_admin' && (
            <>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </>
          )}
        </select>
      </div>
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Role'}
        </button>
      </div>
    </form>
  );
};

export default EditRoleForm;
