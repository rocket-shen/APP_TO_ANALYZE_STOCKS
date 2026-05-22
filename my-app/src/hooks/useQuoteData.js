// filepath: my-app/src/hooks/useQuoteData.js
import { useState } from 'react';
import { fetchQuoteData } from '../services/api';

export const useQuoteData = () => {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  const loadQuote = async (targetSymbol) => {
    setError(null);
    try {
      const quoteResult = await fetchQuoteData(targetSymbol);
      setQuote(quoteResult);
    } catch (err) {
      setError(`获取 ${targetSymbol} 股票行情数据失败`);
      setQuote(null);
    }
  };

  return {
    quote,
    quoteError: error,
    loadQuote,
  };
};