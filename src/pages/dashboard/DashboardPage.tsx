import { useAuth } from '../../hooks/useAuth';

const DashboardPage = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
      <div className="p-6 bg-gray-800/50 rounded-lg shadow-lg backdrop-blur-sm">
        <p>Welcome to the admin dashboard.</p>
        <div className="mt-4">
          <p>Your email: <span className="font-mono text-indigo-400">{user?.email}</span></p>
          <p>Your role: <span className="font-mono text-green-400">{role}</span></p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
