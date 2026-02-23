import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import AcceptInvitePage from './pages/Auth/AcceptInvitePage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';

import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ClientsPage from './pages/Clients/ClientsPage';
import ClientDetailPage from './pages/Clients/ClientDetailPage';
import TimeEntriesPage from './pages/TimeEntries/TimeEntriesPage';
import MyHoursPage from './pages/TimeEntries/MyHoursPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ChangeLogPage from './pages/ChangeLog/ChangeLogPage';
import UsersPage from './pages/Users/UsersPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import SettingsPage from './pages/Settings/SettingsPage';

import PortalLayout from './pages/Portal/PortalLayout';
import PortalDashboard from './pages/Portal/PortalDashboard';
import PortalHours from './pages/Portal/PortalHours';
import PortalCampaigns from './pages/Portal/PortalCampaigns';
import PortalTeam from './pages/Portal/PortalTeam';
import PortalChangeLog from './pages/Portal/PortalChangeLog';

// Error boundary to catch and display React render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#c00' }}>
          <h2>Application Error</h2>
          <pre>{this.state.error.message}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/signin" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/portal" element={<PrivateRoute roles={['client','super_admin','manager']}><PortalLayout /></PrivateRoute>}>
        <Route index element={<PortalDashboard />} />
        <Route path="hours" element={<PortalHours />} />
        <Route path="campaigns" element={<PortalCampaigns />} />
        <Route path="team" element={<PortalTeam />} />
        <Route path="change-log" element={<PortalChangeLog />} />
      </Route>
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="time-entries" element={<PrivateRoute roles={['super_admin','manager']}><TimeEntriesPage /></PrivateRoute>} />
        <Route path="my-hours" element={<MyHoursPage />} />
        <Route path="reports" element={<PrivateRoute roles={['super_admin','manager']}><ReportsPage /></PrivateRoute>} />
        <Route path="change-log" element={<ChangeLogPage />} />
        <Route path="users" element={<PrivateRoute roles={['super_admin','manager']}><UsersPage /></PrivateRoute>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<PrivateRoute roles={['super_admin']}><SettingsPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/signin'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
