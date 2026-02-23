import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface TimeEntry { id: string; user_name: string; campaign_name: string; date: string; hours: number; notes?: string; status: string; }

export default function PortalHours() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/time-entries?date_from=${dateFrom}&date_to=${dateTo}`).then((r) => {
      setEntries(r.data?.entries || r.data || []);
    }).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <>
      <PageMeta title="Hours — Client Portal" description="Time logged on your campaigns" />
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Hours Logged</h1>
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
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 inline-block">
          <p className="text-3xl font-bold text-brand-500">{totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total in period</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            {entries.length === 0 ? (
              <div className="py-12 text-center text-gray-400"><p className="text-3xl mb-2">⏱️</p><p className="text-sm">No entries in this period</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Team Member</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Campaign</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{entry.user_name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.campaign_name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{entry.date}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-500">{entry.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
