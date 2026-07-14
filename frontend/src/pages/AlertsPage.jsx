import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const severityStyles = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
};

const statusStyles = {
  new: 'bg-cyan-100 text-cyan-700',
  acknowledged: 'bg-violet-100 text-violet-700',
  dismissed: 'bg-slate-200 text-slate-700',
};

const AlertsPage = () => {
  const { token, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);
  const [creatingCaseId, setCreatingCaseId] = useState(null);

  const fetchAlerts = async (currentPage = page) => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '8' });
      const statusFilter = activeTab === 'all' ? '' : activeTab;
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alerts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAlerts(response.data.alerts || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(page);
  }, [token, page, activeTab, severityFilter]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts(page);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, page, activeTab, severityFilter]);

  const handleStatusUpdate = async (alertId, nextStatus) => {
    if (!token) return;
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alerts/${alertId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const currentStatusFilter = activeTab === 'all' ? '' : activeTab;
      const shouldRemainVisible = currentStatusFilter === '' || response.data.status === currentStatusFilter;
      setAlerts((prev) => (shouldRemainVisible ? prev.map((entry) => (entry._id === alertId ? response.data : entry)) : prev.filter((entry) => entry._id !== alertId)));
      setToast({ type: 'success', message: `Alert marked as ${response.data.status}.` });
    } catch (error) {
      console.error('Failed to update alert status', error);
      setToast({ type: 'error', message: 'Unable to update alert status.' });
    }
  };

  const handleRescoreAll = async () => {
    if (!token || user?.role !== 'admin') return;

    setRescoreLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alerts/rescore-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToast({ type: 'success', message: `${response.data.alertsCreated || 0} new alerts created.` });
      await fetchAlerts(1);
      setPage(1);
    } catch (error) {
      console.error('Failed to rescore alerts', error);
      setToast({ type: 'error', message: 'Unable to rescore historical logs.' });
    } finally {
      setRescoreLoading(false);
    }
  };

  const handleOpenCase = async (alertId) => {
    if (!token) return;

    setCreatingCaseId(alertId);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cases`,
        { alertIds: [alertId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToast({ type: 'success', message: `Case opened successfully.`, link: `/cases?caseId=${response.data._id}` });
    } catch (error) {
      console.error('Failed to open case', error);
      setToast({ type: 'error', message: 'Unable to open case.' });
    } finally {
      setCreatingCaseId(null);
    }
  };

  const tabs = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'dismissed', label: 'Dismissed' },
  ], []);

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Alert Center</p>
              <h1 className="text-2xl font-semibold">Priority Alerts</h1>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={handleRescoreAll}
                disabled={rescoreLoading}
                className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {rescoreLoading ? 'Rescoring…' : 'Rescore All Historical Logs'}
              </button>
            )}
          </div>
        </header>

        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPage(1); }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="ml-auto text-sm">
              <span className="mr-2 font-medium text-slate-600">Severity</span>
              <select
                value={severityFilter}
                onChange={(event) => { setSeverityFilter(event.target.value); setPage(1); }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Loading alerts…</div>
          ) : alerts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">No alerts match the current filters.</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {alerts.map((alert) => {
                const scoreColor = alert.riskScore >= 81 ? 'text-red-600' : alert.riskScore >= 56 ? 'text-orange-500' : alert.riskScore >= 31 ? 'text-amber-500' : 'text-emerald-500';
                const logDetails = alert.logId || {};

                return (
                  <article key={alert._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{alert.userId?.name || 'Unknown user'}</p>
                        <p className="mt-1 text-xs text-slate-500">{alert.userId?.email || ''}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[alert.status] || statusStyles.new}`}>
                        {alert.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Risk Score</p>
                        <p className={`text-4xl font-semibold ${scoreColor}`}>{alert.riskScore}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[alert.severity] || severityStyles.medium}`}>
                        {alert.severity}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-700">Reasons</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {(alert.reasons || []).map((reason) => (
                          <li key={reason} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-slate-700">Timestamp</p>
                        <p>{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Linked activity</p>
                        <p>{logDetails.actionType || '—'} • {logDetails.resource || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button onClick={() => handleStatusUpdate(alert._id, 'acknowledged')} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                        Acknowledge
                      </button>
                      <button onClick={() => handleStatusUpdate(alert._id, 'dismissed')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        Dismiss
                      </button>
                      <button onClick={() => handleOpenCase(alert._id)} disabled={creatingCaseId === alert._id} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
                        {creatingCaseId === alert._id ? 'Opening…' : 'Open Case'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
          <div>{toast.message}</div>
          {toast.link && (
            <Link to={toast.link} className="mt-2 block font-semibold text-cyan-300 underline">Jump to case</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
