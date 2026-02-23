import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

interface Settings { agency_name: string; timezone: string; logo_url?: string; }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ agency_name: "", timezone: "UTC" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/settings").then((r) => setSettings(r.data || { agency_name: "", timezone: "UTC" })).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await apiClient.put("/settings", settings);
      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save settings");
    } finally { setSaving(false); }
  };

  const timezones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Settings — Agency Tracker" description="Agency settings" />
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your agency settings</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-lg">
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <Label>Agency Name <span className="text-error-500">*</span></Label>
              <Input type="text" placeholder="My Agency" value={settings.agency_name} onChange={(e) => setSettings({ ...settings, agency_name: e.target.value })} />
            </div>
            <div>
              <Label>Timezone</Label>
              <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500">
                {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <Button disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
          </form>
        </div>
      </div>
    </>
  );
}
