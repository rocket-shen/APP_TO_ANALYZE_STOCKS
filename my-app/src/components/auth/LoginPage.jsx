import React, { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { login } from '../../services/api';

const LoginPage = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      const result = await login(username.trim(), password);
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center px-4 py-10 text-slate-200">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="glass-panel relative w-full max-w-sm rounded-2xl p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-cyan-300/80">A股终端</p>
            <h1 className="text-xl font-semibold text-slate-50">登录</h1>
            <p className="text-sm text-slate-400">请先登录后再查询、更新或下载</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-1 w-full py-2.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
