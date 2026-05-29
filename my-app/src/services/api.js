// filepath: my-app/src/services/api.js
export const fetchFinancialData = async (symbol) => {
  const response = await fetch(`/api/v1/financial_data/${symbol}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
};

export const fetchQuoteData = async (symbol) => {
  const response = await fetch(`/api/v1/quote_data/${symbol}`);
  if (!response.ok) {
    throw new Error("获取quote_data行情失败");
  }
  return await response.json();
};

export const fetchFinancialPerformance = async (code) => {
  const response = await fetch(`/api/v1/financial_performance/${code}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
};