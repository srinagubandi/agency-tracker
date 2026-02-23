import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAuth } from '../../context/AuthContext';

/* ─── Styled components ───────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d4f7a 0%, #2E6DA4 50%, #4a8fc4 100%);
  padding: 24px;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Logo = styled.img`
  height: 48px;
  object-fit: contain;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  color: #1a1a2e;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  &:focus {
    border-color: #2E6DA4;
    box-shadow: 0 0 0 3px rgba(46, 109, 164, 0.1);
  }
`;

const ErrorMsg = styled.p`
  font-size: 13px;
  color: #dc2626;
  margin: 0;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
`;

const ForgotLink = styled(Link)`
  font-size: 13px;
  color: #2E6DA4;
  text-decoration: none;
  text-align: right;
  &:hover { text-decoration: underline; }
`;

/* ─── Component ───────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <LoginCard>
        <LogoSection>
          <Logo src="/hsd-logo.png" alt="Health Scale Digital" />
          <h2 style={{fontSize:'22px',fontWeight:700,color:'#1a1a2e',margin:'0 0 4px'}}>Sign In</h2>
          <Subtitle>Agency Tracker — Health Scale Digital</Subtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMsg>{error}</ErrorMsg>}

          <FieldGroup>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <StyledInput
              id="email"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FieldGroup>

          <FieldGroup>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <ForgotLink to="/forgot-password">Forgot password?</ForgotLink>
            </div>
            <StyledInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FieldGroup>

          <button type="submit" disabled={loading} style={{width:'100%',padding:'11px 20px',background:'#2E6DA4',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:600,cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </Form>
      </LoginCard>
    </Page>
  );
};

export default LoginPage;
