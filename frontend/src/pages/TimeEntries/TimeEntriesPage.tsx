/**
 * Time Entries Page — Agency Tracker
 * Log hours, view/approve/reject entries.
 */
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Client { id: string; name: string; }
interface Campaign { id: string; name: string; client_id: string; client_name: string; }
interface TimeEntry { id: string; user_name: string; client_name: string; campaign_name: string; date: string; hours: number; notes?: string; status: string; }

export default function TimeEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ client_id: "", campaign_id: "", date: new Date().toISOString().split("T")[0], hours: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchEntries = () => {
    const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
    apiClient.get(`/time-entries${params}`).then((r) => {
      setEntries(r.data?.entries || r.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      apiClient.get("/clients"),
      apiClient.get("/campaigns"),
    ]).then(([clientsRes, campaignsRes]) => {
      setClients(clientsRes.data || []);
      setCampaigns(campaignsRes.data || []);
    });
    fetchEntries();
  }, []);

  useEffect(() => { fetchEntries(); }, [filterStatus]);

  const handleClientChange = (clientId: string) => {
    setForm({ ...form, client_id: clientId, campaign_id: "" });
    setFilteredCampaigns(campaigns.filter((c) => c.client_id === clientId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await apiClient.post("/time-entries", { campaign_id: form.campaign_id, date: form.date, hours: parseFloat(form.hours), notes: form.notes });
      fetchEntries();
      setShowModal(false);
      setForm({ client_id: "", campaign_id: "", date: new Date().toISOString().split("T")[0], hours: "", notes: "" });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log time");
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    await apiClient.patch(`/time-entries/${id}/approve`);
    fetchEntries();
  };

  const handleReject = async (id: string) => {
    await apiClient.patch(`/time-entries/${id}/reject`);
    fetchEntries();
  };

  const canApprove = user?.role === "super_admin" || user?.role === "manager";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Time Entries — Agency Tracker" description="Log and manage time entries" />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Time Entries</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{entries.length} entries</p>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>+ Log Hours</Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          {entries.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">⏱️</p>
              <p className="text-sm">No time entries found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {canApprove && <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Team Member</th>}
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Campaign</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Hours</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  {canApprove && <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    {canApprove && <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{entry.user_name}</td>}
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.client_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.campaign_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.date}</td>
                    <td className="px-6 py-4 font-semibold text-brand-500">{entry.hours}h</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : entry.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>{entry.status}</span>
                    </td>
                    {canApprove && (
                      <td className="px-6 py-4">
                        {entry.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(entry.id)} className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400">Approve</button>
                            <button onClick={() => handleReject(entry.id)} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Hours Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Log Hours</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Client <span className="text-error-500">*</span></Label>
                <select value={form.client_id} onChange={(e) => handleClientChange(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Campaign <span className="text-error-500">*</span></Label>
                <select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })} disabled={!form.client_id} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
                  <option value="">Select campaign…</option>
                  {filteredCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Date <span className="text-error-500">*</span></Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Hours <span className="text-error-500">*</span></Label>
                <Input type="number" placeholder="0.5" min="0.25" max="24" step={0.25} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="What did you work on?" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving}>{saving ? "Saving…" : "Log Hours"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
