import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/portal", label: "Dashboard", icon: "📊" },
    { path: "/portal/hours", label: "Hours", icon: "⏱️" },
    { path: "/portal/campaigns", label: "Campaigns", icon: "🚀" },
    { path: "/portal/team", label: "Team", icon: "👥" },
    { path: "/portal/changelog", label: "Change Log", icon: "📋" },
  ];

  const isActive = (path: string) => path === "/portal" ? location.pathname === "/portal" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top nav */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">Agency Tracker</span>
            <span className="text-xs text-gray-400 ml-2">Client Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{user?.name}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Sign out</button>
          </div>
        </div>
      </header>

      {/* Sub nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive(item.path) ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
