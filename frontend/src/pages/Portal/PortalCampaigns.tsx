import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface Campaign { id: string; name: string; type: string; status: string; start_date?: string; end_date?: string; budget?: number; total_hours: number; }

export default function PortalCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/campaigns").then((r) => setCampaigns(r.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Campaigns — Client Portal" description="Your campaigns" />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Campaigns</h1>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-400"><p className="text-4xl mb-3">🚀</p><p className="text-sm">No campaigns yet</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{c.status}</span>
                  <span className="text-xs text-gray-400 capitalize">{c.type}</span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-2">{c.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{c.total_hours || 0}h logged</span>
                  {c.budget && <span className="text-gray-500 dark:text-gray-400">${c.budget.toLocaleString()} budget</span>}
                </div>
                {c.start_date && <p className="text-xs text-gray-400 mt-2">{c.start_date}{c.end_date ? ` → ${c.end_date}` : ""}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
