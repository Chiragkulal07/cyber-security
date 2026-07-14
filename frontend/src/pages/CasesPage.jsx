import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const columnStyles = {
  open: 'bg-cyan-50 border-cyan-200',
  investigating: 'bg-amber-50 border-amber-200',
  resolved: 'bg-emerald-50 border-emerald-200',
  escalated: 'bg-rose-50 border-rose-200',
};

const priorityStyles = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
};

const statusLabels = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  escalated: 'Escalated',
};

const CasesPage = () => {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('caseId') || null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [statusChanging, setStatusChanging] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchCases = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Failed to load cases', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetail = async (caseId) => {
    if (!token || !caseId) return;

    setDetailLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCase(response.data);
      setResolutionText(response.data.resolution || '');
    } catch (error) {
      console.error('Failed to load case details', error);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [token]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetail(selectedCaseId);
    }
  }, [selectedCaseId, token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const currentId = searchParams.get('caseId');
    if (currentId !== selectedCaseId) {
      setSelectedCaseId(currentId);
    }
  }, [searchParams]);

  const columns = useMemo(() => ['open', 'investigating', 'resolved', 'escalated'], []);

  const handleOpenCase = (caseId) => {
    setSelectedCaseId(caseId);
    setSearchParams({ caseId });
  };

  const handleCloseModal = () => {
    setSelectedCaseId(null);
    setSelectedCase(null);
    setNoteText('');
    setResolutionText('');
    setSearchParams({});
  };

  const handleUpdateCase = async (updates) => {
    if (!token || !selectedCase) return;

    setStatusChanging(true);
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cases/${selectedCase._id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCase(response.data);
      await fetchCases();
      setToast({ type: 'success', message: 'Case updated.' });
    } catch (error) {
      console.error('Failed to update case', error);
      setToast({ type: 'error', message: 'Unable to update case.' });
    } finally {
      setStatusChanging(false);
    }
  };

  const handleAddNote = async () => {
    if (!token || !selectedCase || !noteText.trim()) return;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cases/${selectedCase._id}/notes`, { text: noteText.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCase(response.data);
      setNoteText('');
      await fetchCases();
      setToast({ type: 'success', message: 'Note added.' });
    } catch (error) {
      console.error('Failed to add note', error);
      setToast({ type: 'error', message: 'Unable to add note.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <header className="rounded-t-3xl border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Incident Response</p>
            <h1 className="text-2xl font-semibold">Investigation Cases</h1>
          </div>
        </header>

        <div className="p-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">Loading cases…</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4">
              {columns.map((columnStatus) => {
                const columnCases = cases.filter((entry) => entry.status === columnStatus);

                return (
                  <section key={columnStatus} className={`rounded-2xl border p-3 ${columnStyles[columnStatus]}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{statusLabels[columnStatus]}</h2>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600">{columnCases.length}</span>
                    </div>

                    <div className="space-y-3">
                      {columnCases.map((entry) => (
                        <button key={entry._id} onClick={() => handleOpenCase(entry._id)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[entry.priority] || priorityStyles.medium}`}>
                              {entry.priority}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{entry.userId?.name || 'Unknown user'}</p>
                          <p className="mt-2 text-xs text-slate-500">Assigned: {entry.assignedTo?.name || 'Unassigned'}</p>
                          <p className="mt-2 text-xs text-slate-500">Updated: {new Date(entry.updatedAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-600">Case detail</p>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedCase.title}</h3>
              </div>
              <button onClick={handleCloseModal} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">Close</button>
            </div>

            {detailLoading ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Loading case details…</div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap gap-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${priorityStyles[selectedCase.priority] || priorityStyles.medium}`}>
                        {selectedCase.priority}
                      </span>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700">{statusLabels[selectedCase.status]}</span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-slate-700">User</p>
                        <p>{selectedCase.userId?.name || 'Unknown user'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Assigned to</p>
                        <p>{selectedCase.assignedTo?.name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Created</p>
                        <p>{new Date(selectedCase.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Updated</p>
                        <p>{new Date(selectedCase.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-slate-900">Linked alerts</h4>
                    </div>
                    <div className="mt-3 space-y-3">
                      {(selectedCase.alertIds || []).map((alert) => (
                        <div key={alert._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{alert.userId?.name || 'Unknown user'}</p>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[alert.severity] || priorityStyles.medium}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">Risk score: {alert.riskScore}</p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {(alert.reasons || []).map((reason) => (
                              <li key={reason} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="text-lg font-semibold text-slate-900">Update case</h4>
                    <div className="mt-3 space-y-3">
                      <label className="block text-sm text-slate-600">
                        <span className="mb-2 block font-medium">Status</span>
                        <select
                          value={selectedCase.status}
                          onChange={(event) => handleUpdateCase({ status: event.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          {columns.map((value) => (
                            <option key={value} value={value}>{statusLabels[value]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm text-slate-600">
                        <span className="mb-2 block font-medium">Priority</span>
                        <select
                          value={selectedCase.priority}
                          onChange={(event) => handleUpdateCase({ priority: event.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </label>
                      <label className="block text-sm text-slate-600">
                        <span className="mb-2 block font-medium">Resolution summary</span>
                        <textarea
                          value={resolutionText}
                          onChange={(event) => setResolutionText(event.target.value)}
                          rows="4"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          placeholder="Add resolution details when the case is resolved"
                        />
                      </label>
                      <button
                        disabled={statusChanging}
                        onClick={() => handleUpdateCase({ status: selectedCase.status, priority: selectedCase.priority, resolution: resolutionText })}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {statusChanging ? 'Saving…' : 'Save updates'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="text-lg font-semibold text-slate-900">Notes timeline</h4>
                    <div className="mt-3 space-y-3">
                      {(selectedCase.notes || []).length === 0 ? (
                        <p className="text-sm text-slate-500">No notes yet.</p>
                      ) : (
                        (selectedCase.notes || []).map((note) => (
                          <div key={`${note.authorId?.name || 'author'}-${note.createdAt}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                              <span className="font-semibold text-slate-700">{note.authorId?.name || 'Unknown author'}</span>
                              <span>{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(event) => setNoteText(event.target.value)}
                        rows="3"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        placeholder="Add an investigation note"
                      />
                      <button onClick={handleAddNote} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CasesPage;
