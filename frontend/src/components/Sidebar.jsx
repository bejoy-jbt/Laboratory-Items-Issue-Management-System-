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
    <div className="w-72 text-white min-h-screen p-4 border-r border-white/10 bg-slate-950/30 backdrop-blur-xl">
      <div className="mb-7 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-100">Lab Items Issue</h1>
        <p className="text-slate-400 text-sm mt-1">Management System</p>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-slate-400">Signed in</div>
        <div className="font-semibold mt-1">
          <span className="inline-block rounded-md bg-white/85 px-2 py-0.5 text-black">
            {user?.name}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-1">{getRoleName(user?.role)}</div>
      </div>

      <nav className="space-y-2">
        <Link
          to={getRolePath(user?.role)}
          className={`block px-4 py-2.5 rounded-xl border transition ${
            activePage === 'dashboard' || location.pathname === getRolePath(user?.role)
              ? 'bg-white/10 border-white/15 text-slate-100'
              : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          Dashboard
        </Link>
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/create-admin`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'create-admin'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Create Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-lab`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'create-lab'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Create Lab
            </Link>
            <Link
              to={`${getRolePath(user.role)}/assign-admin`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'assign-admin'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Assign Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/admins`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'admins'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Admins
            </Link>
            <Link
              to={`${getRolePath(user.role)}/labs`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'labs'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Labs
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-user`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'create-user'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Create User
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'users'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/items`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'items'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/reports`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'reports'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
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
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'labs'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              My Labs
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-lab-admin`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'create-lab-admin'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Create Lab Admin
            </Link>
            <Link
              to={`${getRolePath(user.role)}/create-user`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'create-user'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Create User
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'users'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/lab-admins`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'lab-admins'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Lab Admins
            </Link>
            <Link
              to={`${getRolePath(user.role)}/reports`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'reports'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
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
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'items'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Manage Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/users`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'users'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              View Users
            </Link>
            <Link
              to={`${getRolePath(user.role)}/issue`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'issue'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Issue Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/history`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'history'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Issue History
            </Link>
            <Link
              to={`${getRolePath(user.role)}/reports`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'reports'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Reports
            </Link>
          </>
        )}

        {user?.role === 'USER' && (
          <>
            <Link
              to={`${getRolePath(user.role)}/items`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'items'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              Available Items
            </Link>
            <Link
              to={`${getRolePath(user.role)}/issued`}
              className={`block px-4 py-2.5 rounded-xl border transition ${
                activePage === 'issued'
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              My Issued Items
            </Link>
          </>
        )}
      </nav>

      <div className="mt-8 pt-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-xl font-semibold transition
            bg-rose-500/15 text-rose-100 border border-rose-500/25 hover:bg-rose-500/25"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

