import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { WidgetCard } from '../../components/ui';
import api from '../../api/client';

const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-bottom:32px;`;
const KpiValue = styled.div`font-size:32px;font-weight:700;color:#2E6DA4;margin:12px 0 4px;`;
const KpiLabel = styled.div`font-size:13px;color:#6b7280;`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;

const PortalDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.get('/reports/dashboard-stats').then(r=>setStats(r.data||{})).catch(()=>{}); }, []);
  return (
    <div>
      <PageTitle>Client Dashboard</PageTitle>
      <Grid>
        <WidgetCard><KpiValue>{stats.activeCampaigns||0}</KpiValue><KpiLabel>Active Campaigns</KpiLabel></WidgetCard>
        <WidgetCard><KpiValue>{stats.hoursThisWeek||0}h</KpiValue><KpiLabel>Hours This Week</KpiLabel></WidgetCard>
        <WidgetCard><KpiValue>{stats.totalHours||0}h</KpiValue><KpiLabel>Total Hours</KpiLabel></WidgetCard>
      </Grid>
    </div>
  );
};

export default PortalDashboard;
