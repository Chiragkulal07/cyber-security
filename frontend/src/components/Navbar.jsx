import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Threat Ops</p>
          <p className="text-lg font-semibold">Insider Threat Portal</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Dashboard</Link>
          {(user?.role === 'admin' || user?.role === 'analyst') && (
            <>
              <Link to="/alerts" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Alerts</Link>
              <Link to="/cases" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Cases</Link>
              {(user?.role === 'admin' || user?.role === 'auditor') && (
                <Link to="/reports" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Reports</Link>
              )}
              <Link to="/logs" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Privileged Activity Logs</Link>
              <Link to="/baselines" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Baselines</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/users" className="rounded-lg px-3 py-2 transition hover:bg-slate-800">Manage Users</Link>
          )}
          <button onClick={handleLogout} className="rounded-lg border border-slate-700 px-3 py-2 transition hover:bg-slate-800">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
