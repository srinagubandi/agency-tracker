import { useEffect, useState } from "react";
import { Link } from "react-router";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

export default function PortalDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get("/reports/dashboard-stats"),
      apiClient.get("/time-entries?limit=5"),
    ]).then(([statsRes, entriesRes]) => {
      setStats(statsRes.data);
      setRecentEntries(entriesRes.data?.entries || entriesRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Client Portal — Agency Tracker" description="Your agency portal" />
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-brand-500">{stats?.activeCampaigns ?? 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active Campaigns</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.hoursThisMonth ?? 0}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hours This Month</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.hoursThisWeek ?? 0}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hours This Week</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white/90">Recent Activity</h2>
            <Link to="/portal/hours" className="text-sm text-brand-500 hover:text-brand-600">View all →</Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="py-12 text-center text-gray-400"><p className="text-3xl mb-2">⏱️</p><p className="text-sm">No recent activity</p></div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentEntries.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{entry.campaign_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entry.user_name} · {entry.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-500">{entry.hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
