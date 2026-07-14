import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const severityColors = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-rose-500',
};

const statusColors = {
  open: 'bg-cyan-500',
  investigating: 'bg-amber-500',
  resolved: 'bg-emerald-500',
  escalated: 'bg-rose-500',
};

const ReportsPage = () => {
  const { token, user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const defaultRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }, []);

  useEffect(() => {
    setFromDate(defaultRange.from);
    setToDate(defaultRange.to);
  }, [defaultRange]);

  const fetchSummary = async (startDate, endDate) => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate);
      if (endDate) params.append('to', endDate);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/summary?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load report summary', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate || toDate) {
      fetchSummary(fromDate, toDate);
    }
  }, [token, fromDate, toDate]);

  const handleExport = async () => {
    if (!token) return;

    setExporting(true);
    try {
      const params = new URLSearchParams({ format: exportFormat });
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `insider-threat-report-${fromDate || defaultRange.from}-to-${toDate || defaultRange.to}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export report', error);
    } finally {
      setExporting(false);
    }
  };

  const statCards = useMemo(() => {
    if (!summary) return [];

    return [
      { label: 'Total Logs', value: summary.totalLogs || 0, accent: 'from-cyan-500 to-sky-600' },
      { label: 'Total Alerts', value: summary.totalAlerts || 0, accent: 'from-amber-500 to-orange-600' },
      { label: 'Total Cases', value: summary.totalCases || 0, accent: 'from-violet-500 to-fuchsia-600' },
      { label: 'Avg Resolution Time (hrs)', value: summary.avgResolutionTimeHours?.toFixed?.(2) ?? 0, accent: 'from-emerald-500 to-teal-600' },
    ];
  }, [summary]);

  const severityEntries = useMemo(() => {
    if (!summary?.alertsBySeverity) return [];
    return Object.entries(summary.alertsBySeverity).map(([key, value]) => ({ key, value }));
  }, [summary]);

  const caseEntries = useMemo(() => {
    if (!summary?.casesByStatus) return [];
    return Object.entries(summary.casesByStatus).map(([key, value]) => ({ key, value }));
  }, [summary]);

  if (!user || (user.role !== 'admin' && user.role !== 'auditor')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Reporting</p>
              <h1 className="text-2xl font-semibold">Threat Intelligence Reports</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                <span className="mr-2 font-medium text-slate-300">From</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white" />
              </label>
              <label className="text-sm">
                <span className="mr-2 font-medium text-slate-300">To</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white" />
              </label>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Export report</p>
              <p className="text-sm text-slate-500">Download this period as JSON or CSV</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button onClick={handleExport} disabled={exporting} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70">
                {exporting ? 'Exporting…' : 'Export Report'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Loading report summary…</div>
          ) : !summary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Select a date range to view reporting insights.</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.accent} p-5 text-white shadow-lg`}>
                    <p className="text-sm text-white/80">{card.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Alerts by Severity</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {severityEntries.map((entry) => (
                      <div key={entry.key}>
                        <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                          <span className="capitalize">{entry.key}</span>
                          <span className="font-semibold text-slate-800">{entry.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div className={`h-2 rounded-full ${severityColors[entry.key] || 'bg-slate-500'}`} style={{ width: `${Math.max(8, entry.value ? (entry.value / Math.max(1, summary.totalAlerts)) * 100 : 0)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Cases by Status</h2>
                  <div className="mt-4 space-y-3">
                    {caseEntries.map((entry) => (
                      <div key={entry.key} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize text-slate-700">{entry.key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-semibold text-slate-900">{entry.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Top Risky Users</h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white text-left text-xs uppercase tracking-[0.24em] text-slate-500">
                        <tr>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">Alert Count</th>
                          <th className="px-3 py-2">Avg Risk Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-sm">
                        {(summary.topRiskyUsers || []).map((entry) => (
                          <tr key={entry.userId}>
                            <td className="px-3 py-3 font-medium text-slate-700">{entry.userName}</td>
                            <td className="px-3 py-3">{entry.alertCount}</td>
                            <td className="px-3 py-3">{entry.avgRiskScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">Quick Insights</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-700">Highest alert volume</p>
                      <p className="mt-1">{(summary.topRiskyUsers || [])[0]?.userName || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-700">Most severe alert trend</p>
                      <p className="mt-1">{Math.max(...Object.values(summary.alertsBySeverity || { low: 0, medium: 0, high: 0, critical: 0 }), 0) > 0 ? 'Critical and high severity activity is present in this period.' : 'No alert activity in this period.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
