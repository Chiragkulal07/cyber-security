import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  admin: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  analyst: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  auditor: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Security Center</p>
            <h1 className="text-xl font-semibold">Insider Threat Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-sm ${roleColors[user?.role] || roleColors.analyst}`}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Welcome</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Welcome, {user?.name || 'User'}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your role-based interface is active. Use the navigation bar to move between monitoring features and sensitive account views.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Current role</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user?.role || 'analyst'}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Privileged access</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user?.isPrivileged ? 'Enabled' : 'Standard'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Live status</p>
            <h3 className="mt-3 text-2xl font-semibold">Monitoring active</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Threat signals, user activity, and privileged account changes are being tracked in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
