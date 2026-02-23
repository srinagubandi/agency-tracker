/**
 * AppLayout — main shell for authenticated users.
 * Uses SSA UI Kit's CollapsibleNavBar for the sidebar.
 */
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { CollapsibleNavBar, Icon, Button } from '@ssa-ui-kit/core';
import { useAuth } from '../context/AuthContext';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f4f6f8;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8edf2;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
`;

const RoleBadge = styled.span<{ role: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ role }) =>
    role === 'super_admin'
      ? '#2E6DA4'
      : role === 'manager'
      ? '#17a2b8'
      : role === 'worker'
      ? '#28a745'
      : '#6c757d'};
  color: #fff;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
`;

const LogoImg = styled.img`
  height: 32px;
  object-fit: contain;
`;

const LogoText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
`;

const ALL_NAV_ITEMS = [
  { path: 'dashboard', iconName: 'home' as const, title: 'Dashboard', roles: ['super_admin', 'manager', 'worker', 'client'] },
  { path: 'clients', iconName: 'company' as const, title: 'Clients', roles: ['super_admin', 'manager'] },
  { path: 'time-entries', iconName: 'time-tracking' as const, title: 'All Time Entries', roles: ['super_admin', 'manager'] },
  { path: 'my-hours', iconName: 'clock' as const, title: 'My Hours', roles: ['super_admin', 'manager', 'worker'] },
  { path: 'reports', iconName: 'report' as const, title: 'Reports', roles: ['super_admin', 'manager'] },
  { path: 'change-log', iconName: 'change' as const, title: 'Change Log', roles: ['super_admin', 'manager', 'worker'] },
  { path: 'users', iconName: 'employee' as const, title: 'Users', roles: ['super_admin'] },
  { path: 'notifications', iconName: 'notification' as const, title: 'Notifications', roles: ['super_admin', 'manager', 'worker'] },
  { path: 'settings', iconName: 'settings' as const, title: 'Settings', roles: ['super_admin'] },
];

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  ).map((item) => ({
    path: item.path,
    iconName: item.iconName,
    title: item.title,
    iconSize: 20,
  }));

  const logoEl = (
    <LogoWrapper>
      <LogoImg src="/hsd-logo.png" alt="Health Scale Digital" />
      <LogoText>Agency Tracker</LogoText>
    </LogoWrapper>
  );

  return (
    <Shell>
      <CollapsibleNavBar
        items={navItems}
        renderLogo={logoEl}
        theme="light"
      />
      <Main>
        <TopBar>
          <PageTitle>Health Scale Digital</PageTitle>
          <UserInfo>
            <UserName>{user?.name}</UserName>
            {user?.role && <RoleBadge role={user.role}>{user.role.replace('_', ' ')}</RoleBadge>}
            <Button
              variant="tertiary"
              size="small"
              startIcon={<Icon name="log-out" size={16} />}
              onClick={logout}
            >
              Sign Out
            </Button>
          </UserInfo>
        </TopBar>
        <Content>
          <Outlet />
        </Content>
      </Main>
    </Shell>
  );
};

export default AppLayout;
