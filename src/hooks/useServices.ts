import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Service } from '../lib/types';

// --- Queries ---

export const useGetServices = () => {
  return useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};

// --- Mutations ---

export const useUpdateUserServices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, serviceIds }: { userId: string, serviceIds: string[] }) => {
            // 1. Get current services for the user
            const { data: currentServices, error: currentError } = await supabase
                .from('service_users')
                .select('service_id')
                .eq('user_id', userId);

            if (currentError) throw new Error(currentError.message);

            const currentServiceIds = currentServices.map(s => s.service_id);

            // 2. Find services to add and remove
            const servicesToAdd = serviceIds.filter(id => !currentServiceIds.includes(id));
            const servicesToRemove = currentServiceIds.filter(id => !serviceIds.includes(id));

            // 3. Perform insertions
            if (servicesToAdd.length > 0) {
                const toInsert = servicesToAdd.map(service_id => ({ user_id: userId, service_id, role: 'user' as const }));
                const { error: insertError } = await supabase.from('service_users').insert(toInsert);
                if (insertError) throw new Error(insertError.message);
            }

            // 4. Perform deletions
            if (servicesToRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('service_users')
                    .delete()
                    .eq('user_id', userId)
                    .in('service_id', servicesToRemove);
                if (deleteError) throw new Error(deleteError.message);
            }
        },
        onSuccess: () => {
            // Could be more specific, but this is fine for now
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}
