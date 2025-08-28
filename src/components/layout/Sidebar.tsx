import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-64 flex-shrink-0 bg-gray-800/80 backdrop-blur-lg border-r border-gray-700/50 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-700/50">
          <h1 className="text-2xl font-bold text-indigo-400">AdminSys</h1>
        </div>
        <nav className="mt-6">
          <NavLink
            to="/"
            end
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700/50 ${
                isActive ? 'bg-gray-700 text-white' : ''
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="ml-4">Dashboard</span>
          </NavLink>
          <NavLink
            to="/users"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700/50 ${
                isActive ? 'bg-gray-700 text-white' : ''
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span className="ml-4">Users</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
