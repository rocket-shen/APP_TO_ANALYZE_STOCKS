// filepath: my-app/src/FinancialDashboard.jsx
import React from 'react';
import { Download } from 'lucide-react';
import SearchBar from './components/dashboard/SearchBar';
import DashboardHeader from './components/dashboard/DashboardHeader';
import ReferLink from './components/dashboard/ReferLink';
import BloombergChart from './components/charts/BloombgerCard';
import FinancialTable from './components/dashboard/FinancialTable';
import SyncData from './components/dashboard/SyncData';

// 引入拆分后的原子 Hooks
import { useFinancialData } from './hooks/useFinancialData';
import { useQuoteData } from './hooks/useQuoteData';
import { usePerformance } from './hooks/usePerformance';
import { useDashboardSearch } from './hooks/useDashboardSearch';

const FinancialDashboard = () => {
  // 1. 各司其职的业务数据 Hooks
  const { data, showSync, financialError, loadFinancial, syncFinancial } = useFinancialData();
  const { quote, quoteError, loadQuote } = useQuoteData();
  const { performance, performanceError, loadPerformance } = usePerformance();

  // 2. 统管全局交互的控制 Hook (把业务行为注入进去)
  const { symbol, loading, error, handleSearch, handleSync } = useDashboardSearch(
    loadPerformance,
    loadFinancial,
    loadQuote,
    syncFinancial,
  );

  // 汇聚底层 Hook 的错误提示（如果有的话优先展示顶层错误）
  const displayError = error || financialError || quoteError || performanceError;

  return (
  <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans">
    {/* 全局背景網格（可選，更有終端感） */}
    {/* <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a2333_1px,transparent_1px),linear-gradient(to_bottom,#1a2333_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 pointer-events-none" /> */}

    <div className="relative p-6 max-w-7xl mx-auto">
      {/* 搜索欄區域 */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onSync={handleSync}
          symbol={symbol}
          loading={loading}
          error={displayError}
        />
      </div>

      {/* 行情頭部  */}
      {quote && (
        <div className="glass-panel mb-6 p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 shadow-2xl shadow-cyan-500/10">
          <DashboardHeader quote={quote} />
        </div>
      )}

      {/* 快速連結 */}
      {symbol && (
        <ReferLink symbol={symbol} />
      )}

      {/* 历史财务数据表格 */}
      {performance && (
        <FinancialTable data={performance} />
      )}

      {/* 同步提示卡片 */}
      {showSync && data.length === 0 && (
        <SyncData onSync={handleSync} loading={loading} symbol={symbol} />
      )}

      {/* 圖表區域 */}
      {data.length > 0 && (
        <BloombergChart data={data} />
      )}
    </div>
  </div>
);
};

export default FinancialDashboard;