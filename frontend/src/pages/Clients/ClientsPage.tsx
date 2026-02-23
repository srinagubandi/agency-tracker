/**
 * Clients Page — Agency Tracker
 * Lists all clients with search, status filter, and create modal.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Client {
  id: string;
  name: string;
  slug: string;
  status: string;
  notes?: string;
  logo_url?: string;
  account_count?: number;
  campaign_count?: number;
  created_at: string;
}

interface FormState {
  name: string;
  slug: string;
  status: string;
  notes: string;
}

const autoSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", slug: "", status: "active", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/clients").then((r) => setClients(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiClient.post("/clients", form);
      setClients((prev) => [res.data, ...prev]);
      setShowModal(false);
      setForm({ name: "", slug: "", status: "active", notes: "" });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <>
      <PageMeta title="Clients — Agency Tracker" description="Manage your clients" />
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Clients</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
          {user?.role === "super_admin" && (
            <Button size="sm" onClick={() => setShowModal(true)}>+ New Client</Button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <Input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-sm">{search ? "No clients match your search" : "No clients yet"}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Accounts</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Campaigns</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm flex-shrink-0">
                          {client.logo_url ? (
                            <img src={client.logo_url} alt={client.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90 group-hover:text-brand-500">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client.account_count ?? 0}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client.campaign_count ?? 0}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">New Client</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Client Name <span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Acme Corp"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })}
                 
                />
              </div>
              <div>
                <Label>Slug <span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="acme-corp"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                 
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes…"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving}>{saving ? "Creating…" : "Create Client"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
