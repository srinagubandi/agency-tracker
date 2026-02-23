import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button, Typography, Card } from '@ssa-ui-kit/core';
import api from '../../api/client';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d4f7a 0%, #2E6DA4 50%, #4a8fc4 100%);
  padding: 24px;
`;

const FormCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 16px;
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

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      setMsg('If that email exists, a reset link has been sent.');
    } catch {
      setSuccess(false);
      setMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <FormCard>
        <Logo src="/hsd-logo.png" alt="Health Scale Digital" />
        <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: 8 }}>
          Forgot Password
        </Typography>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Enter your email and we'll send a reset link.
        </p>
        {msg && <Msg success={success}>{msg}</Msg>}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldLabel>Email Address</FieldLabel>
            <StyledInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
            />
          </FieldGroup>
          <Button type="submit" variant="primary" block isDisabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <Link to="/login" style={{ color: '#2E6DA4' }}>Back to Sign In</Link>
        </p>
      </FormCard>
    </Page>
  );
};

export default ForgotPasswordPage;
