// -- filepath: my-app/src/components/dashboard/SearchBar.jsx
import React from 'react';
import { Search, Loader2, RefreshCw, Download } from 'lucide-react';

const SearchBar = ({onSearch, loading, error, onSync, symbol, onDownload }) => {
  const [inputSymbol, setInputSymbol] = React.useState('');

  const handleSearch = () => {
    if (!inputSymbol.trim()) return
      onSearch(inputSymbol);
    };

  const handleSyncClick = () => {
    // 优先使用传入的 symbol（父组件状态），其次 fallback 到本地输入
    const targetSymbol = symbol || inputSymbol;
    if (targetSymbol && onSync) {
      onSync(targetSymbol);
    }
  };

  const handleDownload = async () => {
    const targetSymbol = symbol || inputSymbol;
    if (!targetSymbol || !onDownload) return;
    
    await onDownload(targetSymbol);
  };


  return (
    <div className="max-w-4xl mx-auto mb-6 text-center">
    <h1 className="text-xl font-extrabold mb-3 text-red-500 tracking-wide">A股上市公司財務數據儀表板</h1>
    <div className="flex gap-2 max-w-md mx-auto">
      <input
        type="text"
        placeholder="输入股票代码 (如: SH600519)"
        className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200/60 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all placeholder:text-slate-400 text-slate-800"
        value={inputSymbol}
        onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={loading}
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md disabled:bg-blue-300"
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
        查询
      </button>

      {symbol && (
          <>
            {/* 更新按鈕 */}
            <button
              onClick={handleSyncClick}
              disabled={loading}
              title="同步最新財務數據"
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">更新</span>
            </button>

            {/* 新增：下載 Excel 按鈕 */}
            <button
              onClick={handleDownload}
              disabled={loading || !symbol}
              title="下載 Excel 財務報表"
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">下載</span>
            </button>
          </>
        )}
    </div>
    {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
  </div>
);
};

export default SearchBar;
