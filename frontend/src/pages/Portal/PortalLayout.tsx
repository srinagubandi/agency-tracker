import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAuth } from '../../context/AuthContext';

const Shell = styled.div`min-height:100vh;background:#f4f6f8;`;
const Header = styled.header`background:#fff;border-bottom:1px solid #e8edf2;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;`;
const Logo = styled.img`height:36px;object-fit:contain;`;
const Nav = styled.nav`display:flex;gap:4px;`;
const NavLink = styled(Link, { shouldForwardProp: (prop) => prop !== 'active' })<{active:string}>`padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;color:${({active})=>active==='true'?'#2E6DA4':'#6b7280'};background:${({active})=>active==='true'?'#eff6ff':'transparent'};&:hover{background:#f3f4f6;}`;
const Content = styled.main`padding:32px;max-width:1200px;margin:0 auto;`;

const PortalLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const p = location.pathname;

  return (
    <Shell>
      <Header>
        <Logo src="/hsd-logo.png" alt="Health Scale Digital"/>
        <Nav>
          <NavLink to="/portal" active={(p==='/portal').toString()}>Dashboard</NavLink>
          <NavLink to="/portal/hours" active={(p==='/portal/hours').toString()}>Hours</NavLink>
          <NavLink to="/portal/campaigns" active={(p==='/portal/campaigns').toString()}>Campaigns</NavLink>
          <NavLink to="/portal/team" active={(p==='/portal/team').toString()}>Team</NavLink>
          <NavLink to="/portal/change-log" active={(p==='/portal/change-log').toString()}>Change Log</NavLink>
        </Nav>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'#6b7280'}}>{user?.name}</span>
          <button onClick={logout} style={{padding:'6px 14px',background:'transparent',color:'#6b7280',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'13px',fontWeight:500,cursor:'pointer'}}>Sign Out</button>
        </div>
      </Header>
      <Content><Outlet/></Content>
    </Shell>
  );
};

export default PortalLayout;
