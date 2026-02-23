import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Stats {
  totalClients: number;
  activeCampaigns: number;
  hoursThisWeek: number;
  pendingApprovals: number;
}
interface Activity {
  id: number;
  action: string;
  entity_type: string;
  entity_name: string;
  user_name: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: '#10b981',
  updated: '#f59e0b',
  deleted: '#ef4444',
  approved: '#2E6DA4',
  rejected: '#ef4444',
};

const KPI_ICONS: Record<string, string> = {
  'Total Clients': '🏢',
  'Active Campaigns': '📣',
  'Hours This Week': '⏱',
  'Pending Approvals': '🕐',
};

const KPI_COLORS: Record<string, string> = {
  'Total Clients': '#2E6DA4',
  'Active Campaigns': '#10b981',
  'Hours This Week': '#f59e0b',
  'Pending Approvals': '#ef4444',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeCampaigns: 0,
    hoursThisWeek: 0,
    pendingApprovals: 0,
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/reports/dashboard-stats').catch(() => ({ data: {} })),
          api.get('/change-log?limit=8').catch(() => ({ data: { entries: [] } })),
        ]);
        setStats({
          totalClients: statsRes.data.totalClients || 0,
          activeCampaigns: statsRes.data.activeCampaigns || 0,
          hoursThisWeek: statsRes.data.hoursThisWeek || 0,
          pendingApprovals: statsRes.data.pendingApprovals || 0,
        });
        setActivity(activityRes.data.entries || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = ['Total Clients', 'Active Campaigns', 'Hours This Week', 'Pending Approvals'];
  const kpiValues: Record<string, number> = {
    'Total Clients': stats.totalClients,
    'Active Campaigns': stats.activeCampaigns,
    'Hours This Week': stats.hoursThisWeek,
    'Pending Approvals': stats.pendingApprovals,
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4f7a 0%, #2E6DA4 100%)',
        borderRadius: 12,
        padding: '24px 28px',
        color: '#fff',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
            Here&apos;s what&apos;s happening at Health Scale Digital today.
          </p>
        </div>
        <span style={{ fontSize: 48, opacity: 0.3 }}>🏠</span>
      </div>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {kpis.map((label) => (
          <div key={label} style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(46,109,164,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}>
              {KPI_ICONS[label]}
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 700,
              color: KPI_COLORS[label],
              lineHeight: 1,
              margin: '12px 0 4px',
            }}>
              {loading ? '—' : kpiValues[label]}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '0 0 16px' }}>
        Recent Activity
      </h2>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {activity.length === 0 && !loading && (
          <div style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 14 }}>
            No recent activity.
          </div>
        )}
        {activity.map((a) => (
          <div key={a.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 20px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ACTION_COLORS[a.action] || '#9ca3af',
              marginTop: 6,
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                <strong>{a.user_name}</strong>{' '}{a.action}{' '}
                {a.entity_type.replace('_', ' ')}{' '}
                <strong>{a.entity_name}</strong>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {formatTime(a.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
