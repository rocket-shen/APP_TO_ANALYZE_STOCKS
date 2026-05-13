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
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      {/* 搜索 */}
      <SearchBar
        onSearch={handleSearch}
        onSync={handleSync}
        symbol={symbol}
        loading={loading}
        error={error}
      />

      {/* 行情头部 */}
      {quote && (
        <div className="max-w-6xl mx-auto">
          <DashboardHeader
            quote={quote}
          />
          <div className="mt-4 mb-6 flex gap-3">
            <a 
              href={`https://so.eastmoney.com/web/s?keyword=${symbol}`}
              className="flex-1 text-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              东方财富{quote.name ? ` - ${quote.name}` : ''}
            </a>

            <a 
              href={`https://www.cninfo.com.cn/new/fulltextSearch?notautosubmit=&keyWord=${symbol}`}
              className="flex-1 text-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              巨潮资讯{quote.name ? ` - ${quote.name}` : ''}
            </a>

            <a 
              href={`https://stockpage.10jqka.com.cn/${symbol}`}
              className="flex-1 text-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              同花顺资讯{quote.name ? ` - ${quote.name}` : ''}
            </a>

            <a 
              href={`https://xueqiu.com/k?q=${symbol}`}
              className="flex-1 text-center px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              雪球资讯{quote.name ? ` - ${quote.name}` : ''}
            </a>
          </div>
        </div>
      )}

      {/* 同步引导区域：仅在没有数据且触发了 showSync 时显示 */}
      {showSync && data.length === 0 && (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-slate-100 rounded-xl shadow-sm text-center animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">未发现本地数据</h3>
          <p className="text-slate-500 text-sm mb-6">
            数据库中暂无股票 <span className="font-mono font-bold text-blue-600">{symbol}</span> 的历史财报。
          </p>
          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium px-4 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all"
          >
            {loading ? "正在同步抓取..." : "立即从云端同步数据"}
          </button>
        </div>
      )}

      

      {data.length > 0 && (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
  );
};

export default FinancialDashboard;