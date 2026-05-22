// filepath: my-app/src/hooks/useDashboardSearch.js
import { useState } from 'react';

export const useDashboardSearch = (loadPerformance, loadFinancial, loadQuote, syncFinancial) => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [combinedError, setCombinedError] = useState(null);

  const handleSearch = async (targetSymbol) => {
    if (!targetSymbol) return;

    setSymbol(targetSymbol);
    setLoading(true);
    setCombinedError(null);

    await Promise.allSettled([
        loadFinancial(targetSymbol),
        loadQuote(targetSymbol),
        loadPerformance(targetSymbol)
    ]);

    setLoading(false);
  };

  const handleSync = async () => {
    if (!symbol) return;
    setLoading(true);
    setCombinedError(null);
    try {
      await syncFinancial(symbol);
    } catch (err) {
      setCombinedError("网络异常，无法连接同步接口");
    } finally {
      setLoading(false);
    }
  };

  return {
    symbol,
    loading,
    error: combinedError,
    handleSearch,
    handleSync,
  };
};