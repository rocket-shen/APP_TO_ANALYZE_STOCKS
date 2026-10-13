// -- filepath: my-app/src/components/dashboard/SearchBar.jsx
import React from 'react';
import { Search, Loader2, RefreshCw, Download } from 'lucide-react';

const SearchBar = ({onSearch, loading, downloading = false, error, onSync, symbol, onDownload }) => {
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
    if (!targetSymbol || !onDownload || downloading) return;
    await onDownload(targetSymbol);
  };

  const isBusy = loading || downloading;


  return (
    <div className="w-full">
      <h1 className="mb-2 text-sm font-semibold tracking-wide text-slate-100 sm:text-base">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-500 align-middle shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
        A股上市公司財務數據儀表板
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="输入股票代码 (如: SH600519)"
          className="field min-w-[12rem] flex-1"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isBusy}
        />
        <button
          onClick={handleSearch}
          disabled={isBusy}
          className="btn btn-primary"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          查询
        </button>

        {symbol && (
            <>
              <button
                onClick={handleSyncClick}
                disabled={isBusy}
                title="同步最新財務數據"
                className="btn btn-amber"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">更新</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isBusy || !symbol}
                title="下載 Excel 財務報表"
                className="btn btn-emerald"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{downloading ? '下載中' : '下載'}</span>
              </button>
            </>
          )}
      </div>
      {error && (
        <p className="mt-2 inline-flex rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchBar;
