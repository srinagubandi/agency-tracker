import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        loginWithToken(token, user);
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontSize: 16, color: '#6b7280' }}>Signing you in…</p>
    </div>
  );
};

export default AuthCallbackPage;
