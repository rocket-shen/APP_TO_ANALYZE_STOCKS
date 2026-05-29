// filepath: my-app/src/hooks/useFinancialData.js
import { useState } from 'react';
import { fetchFinancialData } from '../services/api';

export const useFinancialData = () => {
  const [data, setData] = useState([]);
  const [showSync, setShowSync] = useState(false);
  const [error, setError] = useState(null);

  const loadFinancial = async (targetSymbol) => {
    setError(null);
    setShowSync(false);
    try {
      const financialResult = await fetchFinancialData(targetSymbol);
      if (!financialResult || financialResult.length === 0) {
        setError(`未找到代码 ${targetSymbol} 的财务数据`);
        setShowSync(true);
        setData([]);
      } else {
        setData([...financialResult].reverse());
        setShowSync(false);
      }
    } catch (err) {
      setError("获取财务数据失败");
      setData([]);
      setShowSync(true);
    }
  };

  const syncFinancial = async (symbol) => {
    const response = await fetch(`/api/v1/sync_financial_data/${symbol}`, { method: 'POST' });
    const result = await response.json();
    
    if (response.ok) {
      await loadFinancial(symbol);
      return true;
    } else {
      setError(`同步失败: ${result.detail || "未知错误"}`);
      return false;
    }
  };

  return {
    data,
    showSync,
    financialError: error,
    loadFinancial,
    syncFinancial,
  };
};