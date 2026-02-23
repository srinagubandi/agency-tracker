import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface TimeEntry { id: string; campaign_name: string; client_name: string; date: string; hours: number; notes?: string; status: string; }

export default function MyHoursPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = () => {
    setLoading(true);
    apiClient.get(`/time-entries?date_from=${dateFrom}&date_to=${dateTo}`).then((entriesRes) => {
      setEntries(entriesRes.data?.entries || entriesRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const approvedHours = entries.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.hours, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="My Hours — Agency Tracker" description="View your logged hours" />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">My Hours</h1>

        {/* Date Range Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{totalHours.toFixed(1)}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Hours</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{approvedHours.toFixed(1)}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Approved</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{(totalHours - approvedHours).toFixed(1)}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pending</p>
          </div>
        </div>

        {/* Entries Table */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white/90">Time Entries</h2>
          </div>
          {entries.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p className="text-3xl mb-2">⏱️</p>
              <p className="text-sm">No entries in this period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Campaign</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Hours</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{entry.campaign_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.client_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.date}</td>
                    <td className="px-6 py-4 font-semibold text-brand-500">{entry.hours}h</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : entry.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
