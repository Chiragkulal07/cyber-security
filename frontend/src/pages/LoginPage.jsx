import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 lg:flex-row">
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Insider Threat Detection</p>
          <h1 className="mt-6 text-4xl font-semibold">Secure operations at a glance</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            Monitor access anomalies, privilege escalations, and sensitive behavior with a role-aware control center.
          </p>
          <div className="mt-8 rounded-2xl border border-cyan-900/60 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="font-medium text-cyan-300">Demo logins</p>
            <p className="mt-2">admin@demo.com / admin123</p>
            <p>analyst@demo.com / analyst123</p>
            <p>auditor@demo.com / auditor123</p>
          </div>
        </div>

        <div className="flex-1 p-8 sm:p-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40">
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue to your security workspace.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-400"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-6 text-slate-500">
              Demo accounts are pre-seeded for immediate testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
