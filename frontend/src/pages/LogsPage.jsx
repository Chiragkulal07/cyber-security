import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const actionBadgeClass = {
  login: 'bg-slate-100 text-slate-700',
  sudo: 'bg-amber-100 text-amber-700',
  db_query: 'bg-cyan-100 text-cyan-700',
  file_access: 'bg-emerald-100 text-emerald-700',
  file_download: 'bg-indigo-100 text-indigo-700',
  config_change: 'bg-rose-100 text-rose-700',
  permission_change: 'bg-violet-100 text-violet-700',
};

const LogsPage = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchLogs = async (currentPage = page) => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: '8' });
      if (selectedUser) params.append('userId', selectedUser);
      if (selectedAction) params.append('actionType', selectedAction);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load logs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivilegedUsers = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.filter((entry) => entry.isPrivileged));
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  useEffect(() => {
    fetchPrivilegedUsers();
  }, [token]);

  useEffect(() => {
    fetchLogs(page);
  }, [token, page, selectedUser, selectedAction, fromDate, toDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(page);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, page, selectedUser, selectedAction, fromDate, toDate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSimulate = async () => {
    if (!token) return;

    setSimulating(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logs/simulate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFlashId(response.data._id);
      setPage(1);
      await fetchLogs(1);
      if (response.data.alertCreated) {
        setToast({ type: 'success', message: `⚠️ New alert generated for ${response.data.userId?.name || 'the selected user'}` });
      }
      setTimeout(() => setFlashId(null), 2200);
    } catch (error) {
      console.error('Simulation failed', error);
    } finally {
      setSimulating(false);
    }
  };

  const actionOptions = useMemo(() => [
    'login',
    'sudo',
    'db_query',
    'file_access',
    'file_download',
    'config_change',
    'permission_change',
  ], []);

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live telemetry</p>
              <h1 className="text-2xl font-semibold">Privileged Activity Logs</h1>
            </div>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {simulating ? 'Simulating...' : 'Simulate New Activity'}
            </button>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-600">User</span>
              <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">All privileged users</option>
                {users.map((entry) => (
                  <option key={entry._id} value={entry._id}>{entry.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-600">Action</span>
              <select value={selectedAction} onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-600">From</span>
              <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>

            <label className="text-sm">
              <span className="mb-2 block font-medium text-slate-600">To</span>
              <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Data Volume (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">Loading logs…</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">No logs found.</td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry._id} className={`transition-all duration-1000 ${entry._id === flashId ? 'bg-cyan-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]' : 'bg-white'}`}>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">{entry.userId?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadgeClass[entry.actionType] || 'bg-slate-100 text-slate-700'}`}>
                        {entry.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{entry.resource || '—'}</td>
                    <td className="px-4 py-3">{entry.ip || '—'}</td>
                    <td className="px-4 py-3">{entry.dataVolumeMB?.toFixed?.(2) ?? entry.dataVolumeMB}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default LogsPage;
