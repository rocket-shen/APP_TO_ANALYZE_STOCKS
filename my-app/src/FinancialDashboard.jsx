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
import { useDownloadExcel } from './hooks/useDownloadExcel';

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

  const { handleDownload, downloading } = useDownloadExcel();

  // 汇聚底层 Hook 的错误提示（如果有的话优先展示顶层错误）
  const displayError = error || financialError || quoteError || performanceError;

  return (
  <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
   
      {/* Sticky Header */}
    <header className="sticky top-0 z-50">
      <SearchBar
        onSearch={handleSearch}
        onSync={handleSync}
        onDownload={handleDownload}
        symbol={symbol}
        loading={loading}
        error={displayError}
      />
    </header>

    {/* Main Content */}
    <main className="px-6 py-6 space-y-6">  

      {/* 行情頭部  */}
      {quote && (
        <div className="glass-panel mb-6 p-6 rounded-2xl ring-1 ring-cyan-500/10 border border-cyan-500/20 backdrop-blur-md bg-black/40 shadow-2xl shadow-[0_0_40px_rgba(0,255,255,0.06)]">
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
    </main>
  </div>
);
};

export default FinancialDashboard;