import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d4f7a 0%, #2E6DA4 50%, #4a8fc4 100%);
  padding: 24px;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
`;

const Logo = styled.img`
  height: 40px;
  object-fit: contain;
  display: block;
  margin: 0 auto 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #2E6DA4; }
`;

const Msg = styled.p<{ success?: boolean }>`
  font-size: 13px;
  color: ${({ success }) => (success ? '#16a34a' : '#dc2626')};
  padding: 8px 12px;
  border-radius: 6px;
  background: ${({ success }) => (success ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ success }) => (success ? '#bbf7d0' : '#fecaca')};
  margin-bottom: 16px;
`;

const AcceptInvitePage: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const token = searchParams.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setMsg('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/accept-invite', { token, name, password });
      loginWithToken(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Invalid or expired invite link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <FormCard>
        <Logo src="/hsd-logo.png" alt="Health Scale Digital" />
        <h2 style={{fontSize:'22px',fontWeight:700,color:'#1a1a2e',textAlign:'center',marginBottom:8,marginTop:0}}>Accept Invitation</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Set up your account to get started.
        </p>
        {msg && <Msg>{msg}</Msg>}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldLabel>Full Name</FieldLabel>
            <StyledInput type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Password</FieldLabel>
            <StyledInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Confirm Password</FieldLabel>
            <StyledInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
          </FieldGroup>
          <button type="submit" disabled={loading} style={{width:'100%',padding:'11px 20px',background:'#2E6DA4',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>
            {loading ? 'Setting up…' : 'Create Account'}
          </button>
        </form>
      </FormCard>
    </Page>
  );
};

export default AcceptInvitePage;
