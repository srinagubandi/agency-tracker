/**
 * AppLayout — main shell for authenticated users.
 * Uses a custom sidebar built with SSA UI Kit primitives (Button, Icon, Typography).
 * Avoids CollapsibleNavBar due to a known crash with items that have no submenus.
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { Icon, Button } from '@ssa-ui-kit/core';
import { useAuth } from '../context/AuthContext';

/* ─── Styled Components ─────────────────────────────────────────── */

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f4f6f8;
`;

const Sidebar = styled.nav<{ collapsed: boolean }>`
  width: ${({ collapsed }) => (collapsed ? '64px' : '240px')};
  min-height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e8edf2;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid #e8edf2;
  min-height: 64px;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
`;

const LogoImg = styled.img`
  height: 28px;
  flex-shrink: 0;
  object-fit: contain;
`;

const LogoText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
`;

const CollapseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  color: #6b7280;
  flex-shrink: 0;
  &:hover {
    background: #f3f4f6;
  }
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 12px 8px;
  flex: 1;
  overflow-y: auto;
`;

const NavItem = styled.li`
  margin-bottom: 2px;
`;

const StyledNavLink = styled(NavLink)<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: #f0f4ff;
    color: #2E6DA4;
  }

  &.active {
    background: #e8f0fe;
    color: #2E6DA4;
    font-weight: 600;
  }

  svg path {
    transition: fill 0.15s, stroke 0.15s;
  }
`;

const NavLabel = styled.span<{ collapsed: boolean }>`
  opacity: ${({ collapsed }) => (collapsed ? 0 : 1)};
  width: ${({ collapsed }) => (collapsed ? 0 : 'auto')};
  transition: opacity 0.15s, width 0.15s;
  overflow: hidden;
`;

const SidebarFooter = styled.div`
  padding: 12px 8px;
  border-top: 1px solid #e8edf2;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
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

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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

/* ─── Nav Items Config ───────────────────────────────────────────── */

const ALL_NAV_ITEMS = [
  { path: '/dashboard', iconName: 'home' as const, title: 'Dashboard', roles: ['super_admin', 'manager', 'worker', 'client'] },
  { path: '/clients', iconName: 'company' as const, title: 'Clients', roles: ['super_admin', 'manager'] },
  { path: '/time-entries', iconName: 'time-tracking' as const, title: 'All Time Entries', roles: ['super_admin', 'manager'] },
  { path: '/my-hours', iconName: 'clock' as const, title: 'My Hours', roles: ['super_admin', 'manager', 'worker'] },
  { path: '/reports', iconName: 'report' as const, title: 'Reports', roles: ['super_admin', 'manager'] },
  { path: '/change-log', iconName: 'change' as const, title: 'Change Log', roles: ['super_admin', 'manager', 'worker'] },
  { path: '/users', iconName: 'employee' as const, title: 'Users', roles: ['super_admin'] },
  { path: '/notifications', iconName: 'notification' as const, title: 'Notifications', roles: ['super_admin', 'manager', 'worker'] },
  { path: '/settings', iconName: 'settings' as const, title: 'Settings', roles: ['super_admin'] },
];

/* ─── Component ─────────────────────────────────────────────────── */

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <Shell>
      {/* ── Sidebar ── */}
      <Sidebar collapsed={collapsed}>
        <SidebarHeader>
          {!collapsed && (
            <LogoArea>
              <LogoImg src="/hsd-logo.png" alt="Health Scale Digital" />
              <LogoText>Agency Tracker</LogoText>
            </LogoArea>
          )}
          {collapsed && (
            <LogoArea>
              <LogoImg src="/hsd-logo.png" alt="HSD" />
            </LogoArea>
          )}
          <CollapseBtn
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed
                ? <path d="M9 18l6-6-6-6" />
                : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </CollapseBtn>
        </SidebarHeader>

        <NavList>
          {navItems.map((item) => (
            <NavItem key={item.path}>
              <StyledNavLink to={item.path} collapsed={collapsed} title={collapsed ? item.title : ''}>
                <Icon name={item.iconName} size={20} />
                <NavLabel collapsed={collapsed}>{item.title}</NavLabel>
              </StyledNavLink>
            </NavItem>
          ))}
        </NavList>

        <SidebarFooter>
          <StyledNavLink
            to="/signin"
            collapsed={collapsed}
            onClick={(e) => { e.preventDefault(); logout(); }}
            title={collapsed ? 'Sign Out' : ''}
          >
            <Icon name="log-out" size={20} />
            <NavLabel collapsed={collapsed}>Sign Out</NavLabel>
          </StyledNavLink>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main Content ── */}
      <Main>
        <TopBar>
          <TopBarLeft>
            <PageTitle>Health Scale Digital</PageTitle>
          </TopBarLeft>
          <UserInfo>
            <UserName>{user?.name}</UserName>
            {user?.role && (
              <RoleBadge role={user.role}>{user.role.replace('_', ' ')}</RoleBadge>
            )}
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
