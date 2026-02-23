/**
 * Dashboard — Agency Tracker
 * Shows KPI cards and recent time entries using Agency Tracker design system.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface Stats {
  totalClients: number;
  activeCampaigns: number;
  hoursThisWeek: number;
  pendingApprovals?: number;
}

interface TimeEntry {
  id: string;
  campaign_name: string;
  client_name: string;
  date: string;
  hours: number;
  status: string;
}

function StatCard({ title, value, icon, color, to }: { title: string; value?: number; icon: string; color: string; to?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };
  const content = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${colorMap[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <PageMeta title="Dashboard — Agency Tracker" description="Agency Tracker Dashboard" />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {user?.role !== "worker" && (
            <StatCard title="Total Clients" value={stats?.totalClients} icon="🏢" color="blue" to="/clients" />
          )}
          <StatCard title="Active Campaigns" value={stats?.activeCampaigns} icon="🚀" color="green" />
          <StatCard
            title="Hours This Week"
            value={stats?.hoursThisWeek}
            icon="⏱️"
            color="amber"
            to={user?.role === "worker" ? "/time-entries" : "/reports"}
          />
          {(user?.role === "super_admin" || user?.role === "manager") && (
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals} icon="✅" color="purple" to="/time-entries" />
          )}
        </div>

        {/* Recent Time Entries */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white/90">Recent Time Entries</h2>
            <Link
              to={user?.role === "worker" ? "/time-entries" : "/reports"}
              className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              View all →
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">⏱️</p>
              <p className="text-sm">No time entries this week</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{entry.campaign_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.client_name} · {entry.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      entry.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                      entry.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}>
                      {entry.status}
                    </span>
                    <span className="text-sm font-semibold text-brand-500">{entry.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
