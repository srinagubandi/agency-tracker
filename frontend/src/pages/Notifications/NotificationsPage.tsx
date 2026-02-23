import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";

interface Notification { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    apiClient.get("/notifications").then((r) => setNotifications(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await apiClient.post("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-50 dark:bg-blue-500/10",
    success: "bg-green-50 dark:bg-green-500/10",
    warning: "bg-amber-50 dark:bg-amber-500/10",
    error: "bg-red-50 dark:bg-red-500/10",
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <PageMeta title="Notifications — Agency Tracker" description="Your notifications" />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}>Mark all as read</Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] py-16 text-center text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} className={`rounded-2xl border border-gray-200 dark:border-gray-800 p-5 cursor-pointer transition-all ${!n.is_read ? `${typeColors[n.type] || typeColors.info} border-l-4 border-l-brand-500` : "bg-white dark:bg-white/[0.03]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className={`font-medium ${!n.is_read ? "text-gray-800 dark:text-white/90" : "text-gray-600 dark:text-gray-400"}`}>{n.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
