import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";

interface EmployeeReport { user_id: string; user_name: string; total_hours: number; approved_hours: number; pending_hours: number; }
interface ClientReport { client_id: string; client_name: string; total_hours: number; approved_hours: number; }
interface CampaignReport { campaign_id: string; campaign_name: string; client_name: string; total_hours: number; approved_hours: number; }

export default function ReportsPage() {
  const [tab, setTab] = useState<"employee" | "client" | "campaign">("employee");
  const [employeeData, setEmployeeData] = useState<EmployeeReport[]>([]);
  const [clientData, setClientData] = useState<ClientReport[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchReports = () => {
    setLoading(true);
    const params = `?date_from=${dateFrom}&date_to=${dateTo}`;
    Promise.all([
      apiClient.get(`/reports/by-employee${params}`),
      apiClient.get(`/reports/by-client${params}`),
      apiClient.get(`/reports/by-campaign${params}`),
    ]).then(([empRes, clientRes, campRes]) => {
      setEmployeeData(empRes.data || []);
      setClientData(clientRes.data || []);
      setCampaignData(campRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [dateFrom, dateTo]);

  const tabs = [
    { key: "employee" as const, label: "By Employee" },
    { key: "client" as const, label: "By Client" },
    { key: "campaign" as const, label: "By Campaign" },
  ];

  return (
    <>
      <PageMeta title="Reports — Agency Tracker" description="Time tracking reports" />
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyse time across employees, clients, and campaigns</p>
        </div>

        {/* Date Range */}
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

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            {tab === "employee" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Employee</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Approved</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {employeeData.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No data for this period</td></tr>
                  ) : employeeData.map((row) => (
                    <tr key={row.user_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{row.user_name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-500">{row.total_hours}h</td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{row.approved_hours}h</td>
                      <td className="px-6 py-4 text-right text-amber-600 dark:text-amber-400">{row.pending_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "client" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {clientData.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">No data for this period</td></tr>
                  ) : clientData.map((row) => (
                    <tr key={row.client_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{row.client_name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-500">{row.total_hours}h</td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{row.approved_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "campaign" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Campaign</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaignData.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No data for this period</td></tr>
                  ) : campaignData.map((row) => (
                    <tr key={row.campaign_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{row.campaign_name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.client_name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-500">{row.total_hours}h</td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{row.approved_hours}h</td>
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
