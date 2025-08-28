import { useAuth, logout } from '../../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between md:justify-end h-20 px-6 bg-gray-800/30 backdrop-blur-lg border-b border-gray-700/50">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white"
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center">
        <span className="text-gray-400 mr-4">{user?.email}</span>
        <button
          onClick={logout}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
