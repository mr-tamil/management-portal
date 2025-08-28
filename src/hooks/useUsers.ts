import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { UserProfileWithCount, UserRole } from '../lib/types';

// --- Queries ---

export const useGetUsers = (page: number, pageSize: number, searchTerm: string) => {
  return useQuery({
    queryKey: ['users', page, pageSize, searchTerm],
    queryFn: async () => {
      const { data, error, count } = await supabase.rpc('get_users_for_current_user', {
        page_offset: (page - 1) * pageSize,
        page_size: pageSize,
        search_term: searchTerm,
      }, { count: 'exact' });

      if (error) {
        throw new Error(error.message);
      }

      const users = data as UserProfileWithCount[];
      // The total count is now coming from the { count: 'exact' } option
      const totalCount = count ?? 0;

      return { users, totalCount };
    },
  });
};


// --- Mutations ---

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, username, role, serviceIds }: { email: string; username: string; role: UserRole; serviceIds?: string[] }) => {
      const { data, error } = await supabase.rpc('create_user_with_invitation', {
        p_email: email,
        p_username: username,
        p_role: role,
        p_service_ids: serviceIds || [],
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
            const { data, error } = await supabase
                .from('users')
                .update({ role })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            // Also invalidate user role in case we are editing ourselves
            queryClient.invalidateQueries({ queryKey: ['userRole'] });
        }
    });
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
}
