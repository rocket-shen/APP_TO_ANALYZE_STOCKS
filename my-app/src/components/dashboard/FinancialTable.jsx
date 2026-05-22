// filepath: my-app/src/components/dashboard/FinancialTable.jsx
import React from 'react';

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
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
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
    if (val === null || val === undefined) return <span className="text-slate-400">-</span>;
    const isPositive = val > 0;
    return (
      <span className={`font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`}
      </span>
    );
  };

  return (
    <div className="mt-4 w-full glass-panel border border-white/10 backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl overflow-hidden">
      {/* 头部信息区 */}
      <div className="px-3 py-2 border-b border-white/5 bg-white/2 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {data[0]?.stock_name} ({data[0]?.code})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            行业分类：<span className="text-cyan-400">{data[0]?.industry}</span>
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
          历史年报 (展示 {data.length} 期)
        </span>
      </div>

      {/* 表格滚动容器 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-white/5 text-slate-400 text-xs font-medium uppercase tracking-wider">
              <th className="p-3 whitespace-nowrap">{FIELD_LABELS.report_date}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.revenue}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.revenue_yoy}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.revenue_qoq}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.net_profit}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.net_profit_yoy}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.net_profit_qoq}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.eps}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.nav_per_share}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.roe}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.ocf_per_share}</th>
              <th className="p-3 text-right whitespace-nowrap">{FIELD_LABELS.gross_margin}</th>
              <th className="p-3 whitespace-nowrap">{FIELD_LABELS.announce_date}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/3 text-sm">
            {data.map((item, index) => (
              <tr 
                key={item.report_date + index} 
                className="hover:bg-white/2 transition-colors group"
              >
                {/* 报告期 */}
                <td className="p-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                  {item.report_date}
                </td>
                {/* 营业总收入 */}
                <td className="p-4 text-right font-mono text-slate-300">
                  {formatNumber(item.revenue)}
                </td>
                {/* 营收同比 */}
                <td className="p-4 text-right">
                  {renderRate(item.revenue_yoy)}
                </td>
                {/* 营收环比 */}
                <td className="p-4 text-right">
                  {renderRate(item.revenue_qoq)}
                </td>
                {/* 净利润 */}
                <td className="p-4 text-right font-mono text-slate-300">
                  {formatNumber(item.net_profit)}
                </td>
                {/* 净利同比 */}
                <td className="p-4 text-right">
                  {renderRate(item.net_profit_yoy)}
                </td>
                {/* 净利环比 */}
                <td className="p-4 text-right">
                  {renderRate(item.net_profit_qoq)}
                </td>
                {/* 每股收益 */}
                <td className="p-4 text-right font-mono text-slate-300">
                  {item.eps?.toFixed(2) || '-'}
                </td>
                {/* 每股净资产 */}
                <td className="p-4 text-right font-mono text-slate-400">
                  {item.nav_per_share?.toFixed(2) || '-'}
                </td>
                {/* ROE */}
                <td className="p-4 text-right font-mono text-cyan-400">
                  {item.roe ? `${item.roe.toFixed(2)}%` : '-'}
                </td>
                {/* 每股经营现金流 */}
                <td className="p-4 text-right font-mono text-slate-400">
                  {item.ocf_per_share?.toFixed(2) || '-'}
                </td>
                {/* 销售毛利率 */}
                <td className="p-4 text-right font-mono text-slate-300">
                  {item.gross_margin ? `${item.gross_margin.toFixed(2)}%` : '-'}
                </td>
                {/* 公告日期 */}
                <td className="p-4 font-mono text-slate-500 text-xs whitespace-nowrap">
                  {item.announce_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialTable;