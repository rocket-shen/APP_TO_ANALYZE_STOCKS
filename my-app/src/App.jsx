import React, { useCallback, useEffect, useState } from 'react';
import FinancialDashboard from './FinancialDashboard';
import LoginPage from './components/auth/LoginPage';
import { fetchAuthMe, logout as apiLogout } from './services/api';

const App = () => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);

  const applyMe = useCallback((me) => {
    setAuthenticated(Boolean(me?.authenticated));
    setUsername(me?.username || null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchAuthMe();
      applyMe(me);
    } catch {
      setAuthenticated(false);
      setUsername(null);
    }
  }, [applyMe]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      await refreshMe();
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  useEffect(() => {
    const onAuthRequired = () => {
      setAuthenticated(false);
      setUsername(null);
    };
    window.addEventListener('auth:required', onAuthRequired);
    return () => window.removeEventListener('auth:required', onAuthRequired);
  }, []);

  const handleLoginSuccess = async () => {
    await refreshMe();
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // still clear local state
    }
    setAuthenticated(false);
    setUsername(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-slate-400 flex items-center justify-center">
        正在检查登录状态…
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return <FinancialDashboard username={username} onLogout={handleLogout} />;
};

export default App;
