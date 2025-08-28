import { useState } from 'react';
import { useGetUsers, useDeleteUser } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, UserProfileWithCount } from '../../lib/types';
import { MoreVertical, Edit, Trash2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import EditRoleForm from '../forms/EditRoleForm';
import ManageServicesForm from '../forms/ManageServicesForm';
import TableSkeleton from './TableSkeleton';

const UsersTable = ({ searchTerm }: { searchTerm: string }) => {
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [managingServicesUser, setManagingServicesUser] = useState<UserProfile | null>(null);
  const { user: currentUser, role: currentUserRole } = useAuth();
  const pageSize = 10;

  const { data, isLoading, isError, error } = useGetUsers(page, pageSize, searchTerm);
  const deleteUserMutation = useDeleteUser();

  const handleDelete = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => {
          toast.success(`User "${username}" deleted successfully.`);
        },
        onError: (err) => {
          toast.error(`Failed to delete user: ${err.message}`);
        },
      });
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <div className="text-center p-4 text-red-500">Error: {(error as Error).message}</div>;
  }

  const { users, totalCount } = data;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="bg-gray-700/50 text-xs text-gray-400 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">Username</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Joined On</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: UserProfileWithCount) => (
              <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${user.role === 'super_admin' ? 'bg-indigo-600' : user.role === 'admin' ? 'bg-blue-600' : 'bg-gray-600'}`}>{user.role}</span></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}`}>{user.status}</span></td>
                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  {(() => {
                    if (!currentUser || !currentUserRole) return null;
                    // No self-management
                    if (user.id === currentUser.id) return null;

                    const canManage = (currentUserRole === 'super_admin') || (currentUserRole === 'admin' && user.role === 'user');

                    if (canManage) {
                      return (
                        <>
                          <button onClick={() => handleDelete(user.id, user.username)} className="p-1 text-gray-400 hover:text-red-500" title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingUser(user)} className="p-1 text-gray-400 hover:text-indigo-400 ml-2" title="Edit Role">
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentUserRole === 'super_admin' && (
                            <button onClick={() => setManagingServicesUser(user)} className="p-1 text-gray-400 hover:text-green-400 ml-2" title="Manage Services">
                              <Briefcase className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      );
                    }
                    return null;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center p-4 text-sm text-gray-400">
        <div>
          Showing <span className="font-semibold text-white">{startRecord}</span> to <span className="font-semibold text-white">{endRecord}</span> of <span className="font-semibold text-white">{totalCount}</span> results
        </div>
        <div className="flex items-center">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 font-semibold text-white">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not--allowed hover:bg-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      {editingUser && (
        <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User Role">
          <EditRoleForm user={editingUser} onSuccess={() => setEditingUser(null)} />
        </Modal>
      )}
      {managingServicesUser && (
        <Modal isOpen={!!managingServicesUser} onClose={() => setManagingServicesUser(null)} title="Manage Services">
          <ManageServicesForm user={managingServicesUser} onSuccess={() => setManagingServicesUser(null)} />
        </Modal>
      )}
    </div>
  );
};

export default UsersTable;
