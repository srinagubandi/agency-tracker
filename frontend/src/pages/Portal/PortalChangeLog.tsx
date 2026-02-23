import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface ChangeLogEntry { id: string; entity_type: string; entity_name: string; action: string; description: string; user_name: string; created_at: string; }

export default function PortalChangeLog() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/changelog?limit=50").then((r) => setEntries(r.data?.entries || r.data || [])).finally(() => setLoading(false));
  }, []);

  const actionColors: Record<string, string> = {
    created: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    updated: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    deleted: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Change Log — Client Portal" description="Activity log" />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Change Log</h1>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-400"><p className="text-4xl mb-3">📋</p><p className="text-sm">No activity yet</p></div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${actionColors[entry.action] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{entry.action}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{entry.entity_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{entry.description}</p>
                      <p className="text-xs text-gray-400 mt-1">by {entry.user_name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
