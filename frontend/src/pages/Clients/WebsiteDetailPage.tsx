import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Campaign { id: string; name: string; type: string; status: string; start_date?: string; end_date?: string; budget?: number; notes?: string; }
interface Website { id: string; url: string; name: string; platform?: string; client_id: string; client_name: string; account_id: string; account_name: string; campaigns: Campaign[]; }

export default function WebsiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", type: "search", status: "active", start_date: "", end_date: "", budget: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchWebsite = () => {
    apiClient.get(`/websites/${id}`).then((r) => setWebsite(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchWebsite(); }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await apiClient.post(`/websites/${id}/campaigns`, { ...form, budget: form.budget ? parseFloat(form.budget) : undefined });
      fetchWebsite();
      setShowModal(false);
      setForm({ name: "", type: "search", status: "active", start_date: "", end_date: "", budget: "", notes: "" });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create campaign");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!website) return <div className="text-center py-16 text-gray-400">Website not found</div>;

  return (
    <>
      <PageMeta title={`${website.name || website.url} — Agency Tracker`} description="Website detail" />
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/clients" className="hover:text-brand-500">Clients</Link>
          <span>/</span>
          <Link to={`/clients/${website.client_id}`} className="hover:text-brand-500">{website.client_name}</Link>
          <span>/</span>
          <span className="text-gray-800 dark:text-white/90 font-medium">{website.name || website.url}</span>
        </nav>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{website.name || website.url}</h1>
              <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:underline mt-1 block">{website.url}</a>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Account: {website.account_name}</p>
            </div>
            {(user?.role === "super_admin" || user?.role === "manager") && (
              <Button size="sm" onClick={() => setShowModal(true)}>+ Add Campaign</Button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Campaigns</h2>
          {website.campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-12 text-center text-gray-400">
              <p className="text-3xl mb-2">🚀</p>
              <p className="text-sm">No campaigns yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {website.campaigns.map((campaign) => (
                <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{campaign.status}</span>
                    <span className="text-xs text-gray-400 capitalize">{campaign.type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors">{campaign.name}</h3>
                  {campaign.budget && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Budget: ${campaign.budget.toLocaleString()}</p>}
                  {campaign.start_date && <p className="text-xs text-gray-400 mt-2">{campaign.start_date}{campaign.end_date ? ` → ${campaign.end_date}` : ""}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Add Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Campaign Name <span className="text-error-500">*</span></Label><Input type="text" placeholder="Brand Search" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="search">Search</option><option value="display">Display</option><option value="shopping">Shopping</option><option value="video">Video</option><option value="social">Social</option><option value="email">Email</option><option value="seo">SEO</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><Label>Budget ($)</Label><Input type="number" placeholder="0.00" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
              <div><Label>Notes</Label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving}>{saving ? "Adding…" : "Add Campaign"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
