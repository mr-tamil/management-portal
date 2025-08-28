import { useState } from 'react';
import Modal from '../ui/Modal';
import InviteUserForm from './InviteUserForm';
import { Plus } from 'lucide-react';

const InviteUserButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        Invite User
      </button>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite New User"
      >
        <InviteUserForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
};

export default InviteUserButton;
