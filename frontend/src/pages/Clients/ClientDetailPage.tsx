/**
 * Client Detail Page — Agency Tracker
 * Shows client info, accounts, websites, and campaigns hierarchy.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Campaign { id: string; name: string; type: string; status: string; start_date?: string; end_date?: string; budget?: number; }
interface Website { id: string; url: string; name: string; platform?: string; campaigns: Campaign[]; }
interface Account { id: string; name: string; platform: string; account_id?: string; websites: Website[]; }
interface Client { id: string; name: string; slug: string; status: string; notes?: string; logo_url?: string; accounts: Account[]; }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: "", platform: "google_ads", account_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchClient = () => {
    apiClient.get(`/clients/${id}`).then((r) => setClient(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); }, [id]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await apiClient.post(`/clients/${id}/accounts`, accountForm);
      fetchClient();
      setShowAccountModal(false);
      setAccountForm({ name: "", platform: "google_ads", account_id: "" });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create account");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!client) return <div className="text-center py-16 text-gray-400">Client not found</div>;

  const platformColors: Record<string, string> = {
    google_ads: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    meta_ads: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    seo: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    email: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <>
      <PageMeta title={`${client.name} — Agency Tracker`} description={`Client detail for ${client.name}`} />
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/clients" className="hover:text-brand-500">Clients</Link>
          <span>/</span>
          <span className="text-gray-800 dark:text-white/90 font-medium">{client.name}</span>
        </nav>

        {/* Client Header */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xl">
                {client.logo_url ? <img src={client.logo_url} alt={client.name} className="w-full h-full rounded-2xl object-cover" /> : client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{client.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{client.slug}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${client.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
              {client.status}
            </span>
          </div>
          {client.notes && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">{client.notes}</p>}
        </div>

        {/* Accounts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Accounts</h2>
            {(user?.role === "super_admin" || user?.role === "manager") && (
              <Button size="sm" onClick={() => setShowAccountModal(true)}>+ Add Account</Button>
            )}
          </div>

          {client.accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">No accounts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {client.accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platformColors[account.platform] || platformColors.other}`}>
                      {account.platform.replace(/_/g, " ")}
                    </span>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{account.name}</h3>
                    {account.account_id && <span className="text-xs text-gray-400 ml-auto">ID: {account.account_id}</span>}
                  </div>
                  {/* Websites */}
                  {account.websites && account.websites.length > 0 && (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {account.websites.map((website) => (
                        <div key={website.id} className="px-5 py-3">
                          <Link to={`/websites/${website.id}`} className="flex items-center gap-2 group mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-500">🌐 {website.name || website.url}</span>
                            <span className="text-xs text-gray-400">{website.url}</span>
                          </Link>
                          {/* Campaigns */}
                          {website.campaigns && website.campaigns.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {website.campaigns.map((campaign) => (
                                <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="flex items-center gap-2 group py-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-brand-500">🚀 {campaign.name}</span>
                                  <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${campaign.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                                    {campaign.status}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Add Account</h2>
              <button onClick={() => setShowAccountModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label>Account Name <span className="text-error-500">*</span></Label>
                <Input type="text" placeholder="Google Ads Account" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Platform <span className="text-error-500">*</span></Label>
                <select value={accountForm.platform} onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="google_ads">Google Ads</option>
                  <option value="meta_ads">Meta Ads</option>
                  <option value="seo">SEO</option>
                  <option value="email">Email</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Account ID</Label>
                <Input type="text" placeholder="Optional external account ID" value={accountForm.account_id} onChange={(e) => setAccountForm({ ...accountForm, account_id: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAccountModal(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving}>{saving ? "Adding…" : "Add Account"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
