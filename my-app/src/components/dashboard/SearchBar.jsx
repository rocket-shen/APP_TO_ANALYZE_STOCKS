import React from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';

const SearchBar = ({onSearch, loading, error, onSync, symbol }) => {
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


  return (
    <div className="max-w-4xl mx-auto mb-10 text-center">
    <h1 className="text-3xl font-extrabold mb-6 text-slate-800">股票财务透视</h1>
    <div className="flex gap-2 max-w-md mx-auto">
      <input
        type="text"
        placeholder="输入股票代码 (如: SH600519)"
        className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        value={inputSymbol}
        onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={loading}
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md disabled:bg-blue-300"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
        查询
      </button>

      {symbol && (
        <button
          onClick={handleSyncClick}
          disabled={loading}
          title="同步最新财务数据"
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">同步</span>
        </button>
      )}
    </div>
    {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
  </div>
);
};

export default SearchBar;
