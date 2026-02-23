/**
 * DashboardPage — KPI overview cards + recent activity.
 * Uses SSA UI Kit: WidgetCard, Typography, Icon, Badge.
 */
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { WidgetCard, Typography, Icon, Badge } from '../../components/ui';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const KpiCard = styled(WidgetCard)`
  padding: 24px;
`;

const KpiValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #2E6DA4;
  line-height: 1;
  margin: 12px 0 4px;
`;

const KpiLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const KpiIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(46, 109, 164, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
`;

const ActivityCard = styled(WidgetCard)`
  padding: 0;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const ActivityDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
  margin-top: 6px;
  flex-shrink: 0;
`;

const ActivityText = styled.div`
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
`;

const ActivityTime = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;

const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, #1d4f7a 0%, #2E6DA4 100%);
  border-radius: 12px;
  padding: 24px 28px;
  color: #fff;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WelcomeText = styled.div``;

const WelcomeTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
`;

const WelcomeSubtitle = styled.p`
  font-size: 14px;
  opacity: 0.85;
  margin: 0;
`;

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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalClients: 0, activeCampaigns: 0, hoursThisWeek: 0, pendingApprovals: 0 });
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

  const kpis = [
    { label: 'Total Clients', value: stats.totalClients, icon: 'company' as const, color: '#2E6DA4' },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: 'chart' as const, color: '#10b981' },
    { label: 'Hours This Week', value: stats.hoursThisWeek, icon: 'time-tracking' as const, color: '#f59e0b' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: 'clock' as const, color: '#ef4444' },
  ];

  const actionColors: Record<string, string> = {
    created: '#10b981',
    updated: '#f59e0b',
    deleted: '#ef4444',
    approved: '#2E6DA4',
    rejected: '#ef4444',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div>
      <WelcomeBanner>
        <WelcomeText>
          <WelcomeTitle>Welcome back, {user?.name?.split(' ')[0]}!</WelcomeTitle>
          <WelcomeSubtitle>Here's what's happening at Health Scale Digital today.</WelcomeSubtitle>
        </WelcomeText>
        <Icon name="home" size={48} style={{ opacity: 0.3 }} />
      </WelcomeBanner>

      <Grid>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label}>
            <KpiIcon>
              <Icon name={kpi.icon} size={22} style={{ color: kpi.color }} />
            </KpiIcon>
            <KpiValue style={{ color: kpi.color }}>{loading ? '—' : kpi.value}</KpiValue>
            <KpiLabel>{kpi.label}</KpiLabel>
          </KpiCard>
        ))}
      </Grid>

      <SectionTitle>Recent Activity</SectionTitle>
      <ActivityCard title="">
        {activity.length === 0 && !loading && (
          <div style={{ padding: '24px 20px', color: '#9ca3af', fontSize: 14 }}>No recent activity.</div>
        )}
        {activity.map((a) => (
          <ActivityItem key={a.id}>
            <ActivityDot color={actionColors[a.action] || '#9ca3af'} />
            <div>
              <ActivityText>
                <strong>{a.user_name}</strong> {a.action} {a.entity_type.replace('_', ' ')}{' '}
                <strong>{a.entity_name}</strong>
              </ActivityText>
              <ActivityTime>{formatTime(a.created_at)}</ActivityTime>
            </div>
          </ActivityItem>
        ))}
      </ActivityCard>
    </div>
  );
};

export default DashboardPage;
