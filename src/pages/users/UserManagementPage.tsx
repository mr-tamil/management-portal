import { useState } from 'react';
import UsersTable from '../../components/tables/UsersTable';
import InviteUserButton from '../../components/forms/InviteUserButton';

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <InviteUserButton />
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <UsersTable searchTerm={searchTerm} />
    </div>
  );
};

export default UserManagementPage;
