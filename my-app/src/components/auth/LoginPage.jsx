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
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/20 bg-black/50 backdrop-blur-md p-8 shadow-2xl shadow-[0_0_40px_rgba(0,255,255,0.06)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">登录</h1>
            <p className="text-sm text-slate-400">请先登录后再查询、更新或下载</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
