import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface TimeEntry { id: string; user_name: string; date: string; hours: number; notes?: string; status: string; }
interface Campaign {
  id: string; name: string; type: string; status: string;
  start_date?: string; end_date?: string; budget?: number; notes?: string;
  website_id: string; website_name: string; website_url: string;
  client_id: string; client_name: string;
  total_hours: number; time_entries: TimeEntry[];
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/campaigns/${id}`).then((r) => setCampaign(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!campaign) return <div className="text-center py-16 text-gray-400">Campaign not found</div>;

  return (
    <>
      <PageMeta title={`${campaign.name} — Agency Tracker`} description="Campaign detail" />
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <Link to="/clients" className="hover:text-brand-500">Clients</Link>
          <span>/</span>
          <Link to={`/clients/${campaign.client_id}`} className="hover:text-brand-500">{campaign.client_name}</Link>
          <span>/</span>
          <Link to={`/websites/${campaign.website_id}`} className="hover:text-brand-500">{campaign.website_name}</Link>
          <span>/</span>
          <span className="text-gray-800 dark:text-white/90 font-medium">{campaign.name}</span>
        </nav>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{campaign.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{campaign.status}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Type: {campaign.type}</p>
              {campaign.start_date && <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.start_date}{campaign.end_date ? ` → ${campaign.end_date}` : ""}</p>}
            </div>
            <div className="flex gap-6">
              {campaign.budget && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">${campaign.budget.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-500">{campaign.total_hours || 0}h</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Hours</p>
              </div>
            </div>
          </div>
          {campaign.notes && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">{campaign.notes}</p>}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Time Entries</h2>
          {(!campaign.time_entries || campaign.time_entries.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-12 text-center text-gray-400">
              <p className="text-3xl mb-2">⏱️</p>
              <p className="text-sm">No time entries yet</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Team Member</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Hours</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaign.time_entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{entry.user_name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.date}</td>
                      <td className="px-6 py-4 font-semibold text-brand-500">{entry.hours}h</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : entry.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>{entry.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{entry.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
