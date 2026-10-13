// filepath: my-app/src/components/dashboard/SyncData.jsx

import React from 'react';
import { Download, Loader2 } from 'lucide-react';

const SyncData = ({ onSync, loading, symbol }) => {
  return (
    <div className="glass-panel mx-auto mt-4 max-w-md rounded-2xl p-8 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
        <Download className="h-7 w-7 text-cyan-300" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">未發現本地數據</h3>
      <p className="mb-6 text-sm leading-relaxed text-slate-400">
        資料庫中暫無 <span className="num font-semibold text-cyan-300">{symbol}</span> 的歷史財報
      </p>
      <button
        onClick={onSync}
        disabled={loading}
        className="btn btn-primary w-full py-3"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "正在從雲端同步..." : "立即同步抓取數據"}
      </button>
    </div>
  );
};

export default SyncData;
