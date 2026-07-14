import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const roleStyles = {
  admin: 'bg-emerald-100 text-emerald-700',
  analyst: 'bg-cyan-100 text-cyan-700',
  auditor: 'bg-violet-100 text-violet-700',
};

const UsersPage = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'analyst',
    isPrivileged: false,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setFormError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'analyst', isPrivileged: false });
      await fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create user';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Administration</p>
              <h1 className="text-2xl font-semibold">Manage Users</h1>
            </div>
            <button onClick={() => setModalOpen(true)} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Add User
            </button>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Loading users…</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Privileged</th>
                    <th className="px-4 py-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm">
                  {users.map((entry, index) => (
                    <tr key={entry._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 font-medium text-slate-800">{entry.name}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[entry.role] || roleStyles.analyst}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.isPrivileged ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {entry.isPrivileged ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{new Date(entry.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-600">Create user</p>
                <h2 className="text-2xl font-semibold text-slate-900">Add New User</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {formError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium">Name</span>
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium">Email</span>
                  <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              </div>

              <label className="block text-sm text-slate-600">
                <span className="mb-2 block font-medium">Password</span>
                <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  <span className="mb-2 block font-medium">Role</span>
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-600">
                  <input type="checkbox" checked={form.isPrivileged} onChange={(event) => setForm({ ...form, isPrivileged: event.target.checked })} />
                  <span>Is Privileged</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
