// filepath: my-app/src/FinancialDashboard.jsx
import React from 'react';
import { LogOut } from 'lucide-react';
import SearchBar from './components/dashboard/SearchBar';
import DashboardHeader from './components/dashboard/DashboardHeader';
import ReferLink from './components/dashboard/ReferLink';
import BloombergChart from './components/charts/BloombergChart';
import FinancialTable from './components/dashboard/FinancialTable';
import SyncData from './components/dashboard/SyncData';

// 引入拆分后的原子 Hooks
import { useFinancialData } from './hooks/useFinancialData';
import { useQuoteData } from './hooks/useQuoteData';
import { usePerformance } from './hooks/usePerformance';
import { useDashboardSearch } from './hooks/useDashboardSearch';
import { useDownloadExcel } from './hooks/useDownloadExcel';

const FinancialDashboard = ({ username, onLogout }) => {
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
    <div className="app-shell min-h-screen text-slate-200">
      <header className="sticky top-0 z-50 w-full border-b border-cyan-400/15 bg-[#070b14]/80 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <SearchBar
              onSearch={handleSearch}
              onSync={handleSync}
              onDownload={handleDownload}
              symbol={symbol}
              loading={loading}
              downloading={downloading}
              error={displayError}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-7 sm:pt-8">
            {username && (
              <span className="hidden max-w-[8rem] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 sm:inline">
                {username}
              </span>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="退出登录"
                className="btn btn-ghost px-2.5 py-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {!symbol && !loading && (
          <section className="glass-panel rounded-2xl px-6 py-10 text-center">
            <p className="text-xs font-medium tracking-[0.22em] text-cyan-300/80">TERMINAL</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">输入代码开始看盘</h2>
            <p className="mt-2 text-sm text-slate-400">支持沪深代码，例如 SH600519。查询后可同步财报、下载表格并查看图表。</p>
          </section>
        )}

        {quote && (
          <section className="glass-panel rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.05)] sm:p-6">
            <DashboardHeader quote={quote} />
          </section>
        )}

        {symbol && <ReferLink symbol={symbol} />}

        {performance && <FinancialTable data={performance} />}

        {showSync && data.length === 0 && (
          <SyncData onSync={handleSync} loading={loading} symbol={symbol} />
        )}

        {data.length > 0 && <BloombergChart data={data} />}
      </main>
    </div>
  );
};

export default FinancialDashboard;
