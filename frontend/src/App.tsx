import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Auth pages
import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import AcceptInvite from "./pages/AuthPages/AcceptInvite";
import AuthCallback from "./pages/AuthPages/AuthCallback";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Clients & hierarchy
import ClientsPage from "./pages/Clients/ClientsPage";
import ClientDetailPage from "./pages/Clients/ClientDetailPage";
import WebsiteDetailPage from "./pages/Clients/WebsiteDetailPage";
import CampaignDetailPage from "./pages/Clients/CampaignDetailPage";

// Time tracking
import TimeEntriesPage from "./pages/TimeEntries/TimeEntriesPage";
import MyHoursPage from "./pages/TimeEntries/MyHoursPage";

// Reports & logs
import ReportsPage from "./pages/Reports/ReportsPage";
import ChangeLogPage from "./pages/ChangeLog/ChangeLogPage";

// Admin
import UsersPage from "./pages/Users/UsersPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

// Client portal
import PortalLayout from "./pages/Portal/PortalLayout";
import PortalDashboard from "./pages/Portal/PortalDashboard";
import PortalHours from "./pages/Portal/PortalHours";
import PortalCampaigns from "./pages/Portal/PortalCampaigns";
import PortalTeam from "./pages/Portal/PortalTeam";
import PortalChangeLog from "./pages/Portal/PortalChangeLog";

import NotFound from "./pages/OtherPage/NotFound";

// ─── Protected Route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ── Auth pages ─────────────────────────────────────────────── */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<Navigate to="/signin" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Client Portal ──────────────────────────────────────────── */}
          <Route path="/portal" element={<ProtectedRoute allowedRoles={["client"]}><PortalLayout /></ProtectedRoute>}>
            <Route index element={<PortalDashboard />} />
            <Route path="hours" element={<PortalHours />} />
            <Route path="campaigns" element={<PortalCampaigns />} />
            <Route path="team" element={<PortalTeam />} />
            <Route path="changelog" element={<PortalChangeLog />} />
          </Route>

          {/* ── Main app (authenticated, non-client) ───────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin","manager","worker"]}><AppLayout /></ProtectedRoute>}>
            <Route index path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/websites/:id" element={<WebsiteDetailPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/time-entries" element={<TimeEntriesPage />} />
            <Route path="/my-hours" element={<MyHoursPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/changelog" element={<ChangeLogPage />} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={["super_admin","manager"]}><UsersPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={["super_admin"]}><SettingsPage /></ProtectedRoute>} />
          </Route>

          {/* ── Fallback ───────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
