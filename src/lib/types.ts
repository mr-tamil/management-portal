// Based on the SQL schema

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'pending' | 'active' | 'inactive';
export type ServiceUserRole = 'user' | 'admin';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

// This type is what our get_users_for_current_user RPC function returns per row
export type UserProfileWithCount = UserProfile & {
  total_count: number;
};

export type Service = {
    id: string;
    name: string;
    description: string;
    created_at: string;
}
