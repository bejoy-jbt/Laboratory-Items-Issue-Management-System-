import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      const role = result.user?.role;
      const paths = {
        SUPER_ADMIN: '/super-admin',
        ADMIN: '/admin',
        LAB_ADMIN: '/lab-admin',
        USER: '/user'
      };
      navigate(paths[role] || '/login');
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.55)] p-7 md:p-8">
        <div className="mb-7">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 text-center">
            LIIMS Login
          </h2>
          <p className="text-sm text-slate-400 text-center mt-2">
            Sign in to manage inventory and issue records.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-100 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-100
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-100
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold transition
              bg-cyan-500 text-slate-950 hover:bg-cyan-400
              focus:outline-none focus:ring-2 focus:ring-cyan-400/60
              disabled:bg-white/10 disabled:text-slate-400 disabled:hover:bg-white/10"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-7 text-xs text-slate-400">
          {/* <p className="font-semibold text-slate-300 mb-2">Test credentials</p>
          <div className="grid grid-cols-1 gap-1 font-mono">
            <p>Super Admin: superadmin@lab.com / superadmin123</p>
            <p>Admin: admin@lab.com / admin123</p>
            <p>Lab Admin: labadmin@lab.com / labadmin123</p>
            <p>User: user@lab.com / user123</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;

