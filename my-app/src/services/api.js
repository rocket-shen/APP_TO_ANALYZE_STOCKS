export const fetchFinancialData = async (symbol) => {
  const response = await fetch(`/api/financial_data/${symbol}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
};

export const fetchQuoteData = async (symbol) => {
  const response = await fetch(`/api/quote_data/${symbol}`);
  if (!response.ok) {
    throw new Error("获取quote_data行情失败");
  }
  return await response.json();
};