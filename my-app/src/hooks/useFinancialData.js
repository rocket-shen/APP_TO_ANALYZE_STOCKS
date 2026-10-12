// filepath: my-app/src/hooks/useFinancialData.js
import { useState } from 'react';
import { fetchFinancialData, syncFinancialData } from '../services/api';

const STANDARD_QUARTER_ENDS = new Set(['03-31', '06-30', '09-30', '12-31']);

/**
 * Keep one row per year-quarter.
 * Prefer standard quarter-end dates; otherwise keep the latest report_date.
 */
export function dedupeQuarterlyRows(rows, dateKey = 'report_date') {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const best = new Map();
  const order = [];
  const undated = [];

  for (const row of rows) {
    const raw = row?.[dateKey];
    if (raw == null || String(raw).trim() === '') {
      undated.push(row);
      continue;
    }
    const text = String(raw).trim().slice(0, 10);
    const parts = text.split('-').map(Number);
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
      undated.push(row);
      continue;
    }
    const [year, month, day] = parts;
    const quarter = Math.floor((month - 1) / 3) + 1;
    const key = `${year}-Q${quarter}`;
    const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isStandard = STANDARD_QUARTER_ENDS.has(mmdd);

    if (!best.has(key)) {
      best.set(key, { row, dateText: text, isStandard });
      order.push(key);
      continue;
    }

    const prev = best.get(key);
    let replace = false;
    if (isStandard && !prev.isStandard) {
      replace = true;
    } else if (isStandard === prev.isStandard && text > prev.dateText) {
      replace = true;
    }

    if (replace) {
      best.set(key, { row, dateText: text, isStandard });
    }
  }

  return order.map((k) => best.get(k).row).concat(undated);
}

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
        const deduped = dedupeQuarterlyRows(financialResult);
        setData([...deduped].reverse());
        setShowSync(false);
      }
    } catch (err) {
      setError("获取财务数据失败");
      setData([]);
      setShowSync(true);
    }
  };

  const syncFinancial = async (symbol) => {
    const { response, result } = await syncFinancialData(symbol);

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
