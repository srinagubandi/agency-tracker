import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface ChangeLogEntry { id: string; entity_type: string; entity_name: string; action: string; description: string; user_name: string; created_at: string; }

const actionColors: Record<string, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  updated: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  status_changed: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export default function ChangeLogPage() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const fetchLog = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
    if (entityFilter !== "all") params.set("entity_type", entityFilter);
    apiClient.get(`/changelog?${params}`).then((r) => {
      setEntries(r.data?.entries || r.data || []);
      setTotal(r.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLog(); }, [entityFilter, page]);

  const entityTypes = ["all", "client", "account", "website", "campaign", "time_entry", "user"];

  return (
    <>
      <PageMeta title="Change Log — Agency Tracker" description="Activity and change log" />
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Change Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All activity across the platform</p>
        </div>

        {/* Entity Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {entityTypes.map((type) => (
            <button key={type} onClick={() => { setEntityFilter(type); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${entityFilter === type ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
              {type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            {entries.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Entity</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">By</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[entry.action] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{entry.action}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800 dark:text-white/90">{entry.entity_name}</p>
                          <p className="text-xs text-gray-400 capitalize">{entry.entity_type?.replace(/_/g, " ")}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs">{entry.description}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.user_name}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                {total > perPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400">Previous</button>
                      <button onClick={() => setPage((p) => p + 1)} disabled={page * perPage >= total} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
