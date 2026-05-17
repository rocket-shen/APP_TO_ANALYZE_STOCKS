import React, { useState } from 'react';
import { Download } from 'lucide-react';
import SearchBar from './components/dashboard/SearchBar';
import NetProfitChart from './components/charts/NetProfitChart';
import RevenueChart from './components/charts/RevenueChart';
import DashboardHeader from './components/dashboard/DashboardHeader';
import ProfitabilityChart from './components/charts/ProfitabilityChart';
import DebtRiskChart from './components/charts/DebtRiskChart';
import EfficiencyChart from './components/charts/EfficiencyChart';
import CashFlowQualityChart from './components/charts/CashFlowQualityChart';
import CashFlowChart from './components/charts/CashFlowChart';
import AssetTrendChart from './components/charts/AssetTrendChart';
import CurrentAssetChart from './components/charts/CurrentAssetChart';
import CashFlowFreeChart from './components/charts/CashFlowFree';
import CashPaidReceivedChart from './components/charts/CashPaidReceivedChart';
import { fetchFinancialData,  fetchQuoteData } from './services/api';

const FinancialDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [showSync, setShowSync] = useState(false);
  const [symbol, setSymbol] = useState(''); 

  const fetchFinancial = async (targetSymbol) => {
    const financialResult = await fetchFinancialData(targetSymbol);

    if (financialResult.length === 0) {
      setError(`未找到代码 ${targetSymbol} 的财务数据`);
      setShowSync(true);
      setData([]);
    } else {
      setData([...financialResult].reverse());
      setShowSync(false);
    }
  };

  const fetchQuote = async (targetSymbol) => {
    const quoteResult = await fetchQuoteData(targetSymbol);
    setQuote(quoteResult);
  };

  const handleSearch = async (targetSymbol) => {
    if (!targetSymbol) return;

    setSymbol(targetSymbol);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchFinancial(targetSymbol),
        fetchQuote(targetSymbol)
      ]);
    } catch (err) {
      setError("获取数据失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!symbol) return;
    setLoading(true);
      try {
        const response = await fetch(`/api/sync_financial_data/${symbol}`, { method: 'POST' });
        const result = await response.json();
          if (response.ok) {
            await fetchFinancial(symbol); // ✅ 只刷新财务数据
          } else {
            setError(`同步失败: ${result.detail || "未知错误"}`);
          }
        } catch (err) {
          setError("网络异常，无法连接同步接口");
        } finally {
          setLoading(false);
        }
      };

  return (
  <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans">
    {/* 全局背景網格（可選，更有終端感） */}
    <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a2333_1px,transparent_1px),linear-gradient(to_bottom,#1a2333_1px,transparent_1px)] bg-size-[40px_40px] opacity-40 pointer-events-none" />

    <div className="relative p-6 max-w-7xl mx-auto">
      {/* 搜索欄區域 */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onSync={handleSync}
          symbol={symbol}
          loading={loading}
          error={error}
        />
      </div>

      {/* 行情頭部 + 快速連結 */}
      {quote && (
        <div className="glass-panel mb-8 p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 shadow-2xl shadow-cyan-500/10">
          <DashboardHeader quote={quote} />

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href={`https://so.eastmoney.com/web/s?keyword=${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
            >
              东方财富
            </a>
            <a
              href={`https://www.cninfo.com.cn/new/fulltextSearch?notautosubmit=&keyWord=${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
            >
              巨潮资讯
            </a>
            <a
              href={`https://stockpage.10jqka.com.cn/${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
            >
              同花顺
            </a>
            <a
              href={`https://xueqiu.com/k?q=${symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
            >
              雪球
            </a>
          </div>
        </div>
      )}

      {/* 同步提示卡片 */}
      {showSync && data.length === 0 && (
        <div className="glass-panel max-w-md mx-auto mt-12 p-8 text-center border border-white/10 backdrop-blur-2xl bg-black/60 shadow-xl shadow-cyan-900/30 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-cyan-500/20 to-orange-500/20 flex items-center justify-center border border-cyan-400/30">
            <Download className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-white">未發現本地數據</h3>
          <p className="text-slate-400 mb-8">
            資料庫中暫無 <span className="font-mono text-cyan-400 font-bold">{symbol}</span> 的歷史財報
          </p>
          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/50 transition-all active:scale-[0.985]"
          >
            {loading ? "正在從雲端同步..." : "立即同步抓取數據"}
          </button>
        </div>
      )}

      {/* 圖表區域 */}
      {data.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 backdrop-blur-xl bg-black/40 shadow-2xl shadow-black/80">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AssetTrendChart data={data} />
            <CurrentAssetChart data={data} />
            <RevenueChart data={data} />
            <NetProfitChart data={data} />
            <ProfitabilityChart data={data} />
            <DebtRiskChart data={data} />
            <EfficiencyChart data={data} />
            <CashFlowQualityChart data={data} />
            <CashFlowFreeChart data={data} />
            <CashPaidReceivedChart data={data} />
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default FinancialDashboard;