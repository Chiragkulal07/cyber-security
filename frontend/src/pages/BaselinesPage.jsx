import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BaselinesPage = () => {
  const { token } = useAuth();
  const [baselines, setBaselines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rebuildingAll, setRebuildingAll] = useState(false);
  const [rebuildingUserId, setRebuildingUserId] = useState(null);

  const fetchBaselines = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/baseline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBaselines(response.data || []);
    } catch (error) {
      console.error('Failed to load baselines', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, [token]);

  const handleRebuildAll = async () => {
    if (!token) return;
    setRebuildingAll(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/baseline/build-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBaselines();
    } catch (error) {
      console.error('Failed to rebuild baselines', error);
    } finally {
      setRebuildingAll(false);
    }
  };

  const handleRebuildOne = async (userId) => {
    if (!token) return;
    setRebuildingUserId(userId);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/baseline/build/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBaselines();
    } catch (error) {
      console.error('Failed to rebuild baseline', error);
    } finally {
      setRebuildingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Behavioral baselines</p>
              <h1 className="text-2xl font-semibold">User Activity Baselines</h1>
            </div>
            <button
              onClick={handleRebuildAll}
              disabled={rebuildingAll}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {rebuildingAll ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Rebuilding...
                </span>
              ) : (
                'Rebuild All Baselines'
              )}
            </button>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16 text-slate-500">
              Loading baselines...
            </div>
          ) : baselines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              No baselines have been built yet.
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {baselines.map((baseline) => {
                const user = baseline.userId || {};
                const built = baseline.eventsAnalyzed >= 10;
                return (
                  <div key={baseline._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{user.name || 'Unknown User'}</h2>
                        <p className="text-sm text-slate-500">{user.email || ''}</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${built ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {built ? 'Baseline Built ✅' : 'Insufficient Data ⚠️'}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Typical Hours</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {built && baseline.typicalHourRange ? `${baseline.typicalHourRange.startHour} AM - ${baseline.typicalHourRange.endHour} PM` : 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Avg Data Volume</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {built ? `${baseline.avgDataVolumeMB} MB` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Typical IPs</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {built && baseline.typicalIPs?.length ? baseline.typicalIPs.map((ip) => (
                          <span key={ip} className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">{ip}</span>
                        )) : <span className="text-sm text-slate-500">No typical IPs yet</span>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Typical Action Types</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {built && baseline.typicalActionTypes?.length ? baseline.typicalActionTypes.map((action) => (
                          <span key={action} className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-700">{action}</span>
                        )) : <span className="text-sm text-slate-500">No typical actions yet</span>}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                      <div>
                        <p><span className="font-semibold text-slate-900">Events Analyzed:</span> {baseline.eventsAnalyzed || 0}</p>
                        <p><span className="font-semibold text-slate-900">Last Built:</span> {baseline.lastBuiltAt ? new Date(baseline.lastBuiltAt).toLocaleString() : 'Not built'}</p>
                      </div>
                      <button
                        onClick={() => handleRebuildOne(baseline.userId?._id || baseline.userId)}
                        disabled={rebuildingUserId === (baseline.userId?._id || baseline.userId)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {rebuildingUserId === (baseline.userId?._id || baseline.userId) ? 'Rebuilding...' : 'Rebuild'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaselinesPage;
