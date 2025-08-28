import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { useInviteUser } from '../../hooks/useUsers';
import { useGetServices } from '../../hooks/useServices';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../lib/types';
import { toast } from 'react-hot-toast';

interface InviteFormData {
  email: string;
  username: string;
  role: UserRole;
  serviceIds: string[];
}

interface InviteUserFormProps {
  onSuccess: () => void;
}

const InviteUserForm = ({ onSuccess }: InviteUserFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InviteFormData>();
  const inviteUserMutation = useInviteUser();
  const { role: currentUserRole } = useAuth();
  const { data: services, isLoading: isLoadingServices } = useGetServices();

  const onSubmit: SubmitHandler<InviteFormData> = async (data) => {
    // The data from react-hook-form is already in the correct shape.
    inviteUserMutation.mutate(data, {
      onSuccess: () => {
        toast.success(`Invitation sent to ${data.email}`);
        reset();
        onSuccess(); // Close the modal
      },
      onError: (err) => {
        toast.error(`Failed to send invitation: ${err.message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Username</label>
        <input
          id="username"
          {...register('username', { required: 'Username is required' })}
          className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }})}
          className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-400 mb-1">Role</label>
        <select
          id="role"
          {...register('role', { required: 'Role is required' })}
          className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="user">User</option>
          {currentUserRole === 'super_admin' && (
            <>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </>
          )}
        </select>
        {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
      </div>
      {currentUserRole === 'super_admin' && (
        <div>
          <label htmlFor="serviceIds" className="block text-sm font-medium text-gray-400 mb-1">Assign to Services</label>
          <select
            id="serviceIds"
            multiple
            {...register('serviceIds')}
            disabled={isLoadingServices}
            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoadingServices ? (
              <option>Loading services...</option>
            ) : (
              services?.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))
            )}
          </select>
          <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple.</p>
        </div>
      )}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
        </button>
      </div>
    </form>
  );
};

export default InviteUserForm;
