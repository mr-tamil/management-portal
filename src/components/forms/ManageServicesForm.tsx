import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { useGetServices, useUpdateUserServices } from '../../hooks/useServices';
import type { UserProfile } from '../../lib/types';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface ManageServicesFormData {
  serviceIds: string[];
}

interface ManageServicesFormProps {
  user: UserProfile;
  onSuccess: () => void;
}

const useUserServices = (userId: string) => {
  return useQuery({
    queryKey: ['user-services', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_users')
        .select('service_id')
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return data.map(s => s.service_id);
    },
  });
};

const ManageServicesForm = ({ user, onSuccess }: ManageServicesFormProps) => {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<ManageServicesFormData>();

  const { data: allServices, isLoading: isLoadingAllServices } = useGetServices();
  const { data: userServiceIds, isLoading: isLoadingUserServices } = useUserServices(user.id);
  const updateServicesMutation = useUpdateUserServices();

  useEffect(() => {
    // Pre-populate the form with the user's current services
    if (userServiceIds) {
      reset({ serviceIds: userServiceIds });
    }
  }, [userServiceIds, reset]);

  const onSubmit: SubmitHandler<ManageServicesFormData> = (data) => {
    const selectedServiceIds = Array.from(data.serviceIds || []);
    updateServicesMutation.mutate({ userId: user.id, serviceIds: selectedServiceIds }, {
      onSuccess: () => {
        toast.success(`Services updated for ${user.username}`);
        onSuccess();
      },
      onError: (err) => {
        toast.error(`Failed to update services: ${err.message}`);
      },
    });
  };

  const isLoading = isLoadingAllServices || isLoadingUserServices;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <p className="text-gray-400">
          Managing services for <span className="font-semibold text-white">{user.username}</span>
        </p>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {isLoading ? (
          <p className="text-gray-400">Loading services...</p>
        ) : (
          allServices?.map(service => (
            <div key={service.id} className="flex items-center">
              <input
                type="checkbox"
                id={`service-${service.id}`}
                value={service.id}
                {...register('serviceIds')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor={`service-${service.id}`} className="ml-3 text-sm text-gray-300">
                {service.name}
              </label>
            </div>
          ))
        )}
      </div>
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Services'}
        </button>
      </div>
    </form>
  );
};

export default ManageServicesForm;
