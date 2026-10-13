import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
      <div className="app-shell flex min-h-screen items-center justify-center px-4 text-slate-400">
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl px-8 py-7">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          <p className="text-sm tracking-wide">正在检查登录状态…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return <FinancialDashboard username={username} onLogout={handleLogout} />;
};

export default App;
