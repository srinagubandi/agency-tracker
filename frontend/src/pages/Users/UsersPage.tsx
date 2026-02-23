import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface User { id: string; name: string; email: string; role: string; status: string; created_at: string; }

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "worker", client_id: "" });
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = () => {
    apiClient.get("/users").then((r) => setUsers(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    apiClient.get("/clients").then((r) => setClients(r.data || []));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await apiClient.post("/auth/invite", inviteForm);
      setSuccess(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: "", role: "worker", client_id: "" });
      setTimeout(() => { setShowInviteModal(false); setSuccess(""); }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send invitation");
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Deactivate this user?")) return;
    await apiClient.patch(`/users/${userId}`, { status: "inactive" });
    fetchUsers();
  };

  const handleActivate = async (userId: string) => {
    await apiClient.patch(`/users/${userId}`, { status: "active" });
    fetchUsers();
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    manager: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    worker: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    client: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Users — Agency Tracker" description="Manage team members" />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users.length} team members</p>
          </div>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>+ Invite User</Button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                {currentUser?.role === "super_admin" && <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                        {u.name?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{u.name || "—"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{u.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  {currentUser?.role === "super_admin" && (
                    <td className="px-6 py-4">
                      {u.id !== currentUser.id && (
                        u.status === "active"
                          ? <button onClick={() => handleDeactivate(u.id)} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">Deactivate</button>
                          : <button onClick={() => handleActivate(u.id)} className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400">Activate</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Invite User</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input type="email" placeholder="colleague@agency.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
              </div>
              <div>
                <Label>Role <span className="text-error-500">*</span></Label>
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value, client_id: "" })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                  {currentUser?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                  <option value="client">Client</option>
                </select>
              </div>
              {inviteForm.role === "client" && (
                <div>
                  <Label>Client Account</Label>
                  <select value={inviteForm.client_id} onChange={(e) => setInviteForm({ ...inviteForm, client_id: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select client…</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving}>{saving ? "Sending…" : "Send Invitation"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
