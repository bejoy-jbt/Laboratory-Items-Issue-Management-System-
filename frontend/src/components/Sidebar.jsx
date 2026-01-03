import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentPage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    const rolePath = getRolePath(user?.role);
    if (path === rolePath) return 'dashboard';
    return path.replace(`${rolePath}/`, '');
  };
  
  const activePage = currentPage || getCurrentPage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolePath = (role) => {
    const paths = {
      SUPER_ADMIN: '/super-admin',
      ADMIN: '/admin',
      LAB_ADMIN: '/lab-admin',
      USER: '/user'
    };
    return paths[role] || '/login';
  };

  const getRoleName = (role) => {
    const names = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      LAB_ADMIN: 'Lab Admin',
      USER: 'User'
    };
    return names[role] || role;
  };

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Lab Items</h1>
        <p className="text-gray-400 text-sm mt-1">Management System</p>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-400">Logged in as</div>
        <div className="font-semibold">{user?.name}</div>
        <div className="text-xs text-gray-400">{getRoleName(user?.role)}</div>
      </div>

      <nav className="space-y-2">
        <Link
          to={getRolePath(user?.role)}
          className={`block px-4 py-2 rounded ${
            activePage === 'dashboard' || location.pathname === getRolePath(user?.role) ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
        >
          Dashboard
        </Link>
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/create-admin`}
              className={`block px-4 py-2 rounded ${
                activePage === 'create-admin' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Create Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-lab`}
              className={`block px-4 py-2 rounded ${
                activePage === 'create-lab' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Create Lab
            </Link>
            <Link
              to={`${getRolePath(user.role)}/assign-admin`}
              className={`block px-4 py-2 rounded ${
                activePage === 'assign-admin' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Assign Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/admins`}
              className={`block px-4 py-2 rounded ${
                activePage === 'admins' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Admins
            </Link>
            <Link
              to={`${getRolePath(user.role)}/labs`}
              className={`block px-4 py-2 rounded ${
                activePage === 'labs' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Labs
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-user`}
              className={`block px-4 py-2 rounded ${
                activePage === 'create-user' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Create User
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2 rounded ${
                activePage === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/items`}
              className={`block px-4 py-2 rounded ${
                activePage === 'items' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/reports`}
              className={`block px-4 py-2 rounded ${
                activePage === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              System Reports
            </Link>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/labs`}
              className={`block px-4 py-2 rounded ${
                activePage === 'labs' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              My Labs
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-lab-admin`}
              className={`block px-4 py-2 rounded ${
                activePage === 'create-lab-admin' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Create Lab Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-user`}
              className={`block px-4 py-2 rounded ${
                activePage === 'create-user' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Create User
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2 rounded ${
                activePage === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/lab-admins`}
              className={`block px-4 py-2 rounded ${
                activePage === 'lab-admins' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Lab Admins
            </Link>
            <Link
              to={`${getRolePath(user.role)}/reports`}
              className={`block px-4 py-2 rounded ${
                activePage === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Lab Reports
            </Link>
          </>
        )}

        {user?.role === 'LAB_ADMIN' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/items`}
              className={`block px-4 py-2 rounded ${
                activePage === 'items' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Manage Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2 rounded ${
                activePage === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/issue`}
              className={`block px-4 py-2 rounded ${
                activePage === 'issue' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Issue Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/history`}
              className={`block px-4 py-2 rounded ${
                activePage === 'history' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Issue History
            </Link>
          </>
        )}

        {user?.role === 'USER' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/items`}
              className={`block px-4 py-2 rounded ${
                activePage === 'items' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Available Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/issued`}
              className={`block px-4 py-2 rounded ${
                activePage === 'issued' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              My Issued Items
            </Link>
          </>
        )}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

