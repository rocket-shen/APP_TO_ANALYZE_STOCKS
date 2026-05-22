// filepath: my-app/src/components/dashboard/SyncData.jsx

import React from 'react';
import { Download } from 'lucide-react';  

const SyncData = ({ onSync, loading, symbol }) => {
    return (
        <div className="glass-panel max-w-md mx-auto mt-12 p-8 text-center border border-white/10 backdrop-blur-2xl bg-black/60 shadow-xl shadow-cyan-900/30 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/20 to-orange-500/20 flex items-center justify-center border border-cyan-400/30">
            <Download className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-white">未發現本地數據</h3>
          <p className="text-slate-400 mb-8">
            資料庫中暫無 <span className="font-mono text-cyan-400 font-bold">{symbol}</span> 的歷史財報
          </p>
          <button
            onClick={onSync}
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/50 transition-all active:scale-[0.985]"
          >
            {loading ? "正在從雲端同步..." : "立即同步抓取數據"}
          </button>
        </div>
    );
};

export default SyncData;