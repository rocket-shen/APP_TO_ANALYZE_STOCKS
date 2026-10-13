// filepath: my-app/src/components/dashboard/FinancialTable.jsx
import React, { useState, useMemo } from 'react';

// 字段映射字典，方便后续维护或修改表头文字
const FIELD_LABELS = {
  report_date: "报告期",
  revenue: "营业总收入",
  revenue_yoy: "营收同比",
  revenue_qoq: "营收环比",
  net_profit: "净利润",
  net_profit_yoy: "净利同比",
  net_profit_qoq: "净利环比",
  eps: "每股收益",
  nav_per_share: "每股净资产",
  roe: "ROE (净资产收益率)",
  ocf_per_share: "每股经营现金流",
  gross_margin: "销售毛利率",
  announce_date: "公告日期"
};

const FinancialTable = ({ data = [] }) => {
  const [activeQuarter, setActiveQuarter] = useState('Q4'); // 預設顯示四季報

  // 根據 report_date 判斷季度
  const getQuarter = (reportDate) => {
    if (!reportDate) return 'Q4';
    const month = reportDate.substring(5, 7); // 取出 MM
    if (month === '03') return 'Q1';
    if (month === '06') return 'Q2';
    if (month === '09') return 'Q3';
    return 'Q4'; // 12月視為四季報/年報
  };

  // 過濾出當前季度資料（保持時間倒序）
  const filteredData = useMemo(() => {
    return data
      .filter(item => getQuarter(item.report_date) === activeQuarter)
      .sort((a, b) => b.report_date.localeCompare(a.report_date)); // 確保最新在前
  }, [data, activeQuarter]);

  if (data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl px-6 py-10 text-center text-slate-500">
        暂无财务报表数据
      </div>
    );
  }

  // 数字千分位格式化（保留2位小数）
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // 增长率格式化及颜色渲染
  const renderRate = (val) => {
    if (val === null || val === undefined) return <span className="text-slate-500">-</span>;
    const isPositive = val > 0;
    return (
      <span className={`num font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`}
      </span>
    );
  };

  return (
    <div className="glass-panel w-full overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-4 border-b border-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">
            {data[0]?.stock_name} <span className="num text-slate-400">({data[0]?.code})</span>
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            行业分类：<span className="text-cyan-300">{data[0]?.industry}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-slate-950/50 p-1">
            {[
              { label: '一季報', value: 'Q1' },
              { label: '二季報', value: 'Q2' },
              { label: '三季報', value: 'Q3' },
              { label: '四季報', value: 'Q4' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setActiveQuarter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeQuarter === value
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="num rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
            历史财报 (共 {data.length} 期)
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-slate-400 sm:px-5">
        當前顯示：
        <span className="font-medium text-cyan-300">
          {activeQuarter === 'Q1' && '第一季度報告'}
          {activeQuarter === 'Q2' && '第二季度報告'}
          {activeQuarter === 'Q3' && '第三季度報告'}
          {activeQuarter === 'Q4' && '第四季度報告（年報）'}
        </span>
        <span className="text-slate-500">（共 {filteredData.length} 期）</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/40 text-xs font-medium tracking-wider text-slate-400">
              <th className="whitespace-nowrap p-3">{FIELD_LABELS.report_date}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.revenue}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.revenue_yoy}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.revenue_qoq}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.net_profit}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.net_profit_yoy}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.net_profit_qoq}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.eps}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.nav_per_share}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.roe}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.ocf_per_share}</th>
              <th className="whitespace-nowrap p-3 text-right">{FIELD_LABELS.gross_margin}</th>
              <th className="whitespace-nowrap p-3">{FIELD_LABELS.announce_date}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                  该季度暂无数据
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={item.report_date + index}
                  className="transition-colors hover:bg-cyan-400/[0.04]"
                >
                  <td className="num whitespace-nowrap p-3 font-mono font-medium text-slate-200">
                    {item.report_date}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-300">
                    {formatNumber(item.revenue)}
                  </td>
                  <td className="p-3 text-right">
                    {renderRate(item.revenue_yoy)}
                  </td>
                  <td className="p-3 text-right">
                    {renderRate(item.revenue_qoq)}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-300">
                    {formatNumber(item.net_profit)}
                  </td>
                  <td className="p-3 text-right">
                    {renderRate(item.net_profit_yoy)}
                  </td>
                  <td className="p-3 text-right">
                    {renderRate(item.net_profit_qoq)}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-300">
                    {item.eps?.toFixed(2) || '-'}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-400">
                    {item.nav_per_share?.toFixed(2) || '-'}
                  </td>
                  <td className="num p-3 text-right font-mono text-cyan-300">
                    {item.roe ? `${item.roe.toFixed(2)}%` : '-'}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-400">
                    {item.ocf_per_share?.toFixed(2) || '-'}
                  </td>
                  <td className="num p-3 text-right font-mono text-slate-300">
                    {item.gross_margin ? `${item.gross_margin.toFixed(2)}%` : '-'}
                  </td>
                  <td className="num whitespace-nowrap p-3 font-mono text-xs text-slate-500">
                    {item.announce_date}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialTable;
