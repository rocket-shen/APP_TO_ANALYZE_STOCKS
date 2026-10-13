// --filepath my-app/src/components/charts/BloombergChart.jsx
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

// ==========================================
// 彭博终端风格 调色板 (Bloomberg Palette)
// ==========================================
const BB_COLORS = {
  bg: '#0B0E14',
  cardBg: '#12161F',
  grid: '#222A36',
  text: '#A3B1C2',
  textMain: '#FFFFFF',
  blue: '#0055FF',
  amber: '#FF9900',
  green: '#00C261',
  red: '#FF3344',
  purple: '#9933FF',
  cyan: '#00B5E2',
  asset2: '#0A7FB3',
  asset3: '#6C5CE7',
  liab2: '#FF6B6B'
};

const TABS = [
  { id: 'earnings', label: '盈利质量', en: 'EARNINGS QUALITY' },
  { id: 'cashflow', label: '现金流与造血', en: 'CASH FLOW' },
  { id: 'ops', label: '营运效率', en: 'OPS EFFICIENCY' },
  { id: 'solvency', label: '偿债与风险', en: 'SOLVENCY & RISK' }
];

// ==========================================
// 彭博风格自定义 Tooltip
// ==========================================
const BloombergTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#161C26',
        border: '1px solid #313D4F',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: BB_COLORS.textMain,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.5)'
      }}>
        <p style={{ margin: '0 0 5px 0', color: '#8899A6', fontWeight: 'bold' }}>PERIOD: {label}</p>
        {payload.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', margin: '3px 0' }}>
            <span style={{ color: item.color || item.fill }}>{(item.name || '').toString().toUpperCase()}:</span>
            <span style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
              {
                typeof item.value === 'number'
                  ? (
                      Math.abs(item.value) >= 1e6
                        ? `${(item.value / 1e8).toFixed(2)} 亿元`
                        : item.value.toLocaleString()
                    )
                  : (item.value ?? '-')
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const formatXAxis = (tickItem) => {
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  return `${tickItem.substring(2, 4)}/${tickItem.substring(5, 7)}`;
};

const CardTitle = ({ color, children }) => (
  <h2 style={{
    fontSize: '14px',
    margin: '0 0 15px 0',
    color: BB_COLORS.text,
    borderLeft: `3px solid ${color}`,
    paddingLeft: '8px'
  }}>
    {children}
  </h2>
);

const PosNegBarShape = (props) => {
  const { x, y, width, height, value, payload } = props;
  const isPositive = value >= 0;
  let fill = isPositive ? BB_COLORS.green : BB_COLORS.red;
  const dateStr = payload?.report_date?.toString() || '';
  const isYearEnd = dateStr.includes('-12-31') ||
    dateStr.endsWith('/12') ||
    dateStr.includes('/12/');
  if (isYearEnd) {
    fill = '#d4e7f0';
  }
  const rectY = isPositive ? y : y + height;
  const rectHeight = Math.abs(height);
  return (
    <rect
      x={x}
      y={rectY}
      width={width}
      height={rectHeight}
      fill={fill}
      opacity={0.85}
      rx={2}
    />
  );
};

export default function BloombergChart({ data }) {
  const [activeTab, setActiveTab] = useState('earnings');
  const stockName = data?.[0]?.stock_name;
  const toBillion = (val) => (val / 1e8).toFixed(1);

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl px-6 py-12 text-center text-slate-500">
        暂无图表数据
      </div>
    );
  }

  const renderEarnings = () => (
    <>
      <div className="bb-card">
        <CardTitle color={BB_COLORS.amber}>
          净现比 CASH_EARNINGS_RATIO (经营现金流 / 净利润)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={1} stroke={BB_COLORS.amber} strokeDasharray="4 4" strokeWidth={1} opacity={0.7} label={{ value: '1.0', fill: BB_COLORS.amber, fontSize: 10 }} />
              <Line type="monotone" dataKey="cash_earnings_ratio" name="净现比" stroke={BB_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.cyan}>
          销售净利率 NET_PROFIT_MARGIN (%)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="net_profit_margin" name="销售净利率(%)" stroke={BB_COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.red}>
          减值损失占利润比重 IMPAIRMENT_TO_PROFIT (%)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.red} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={1} opacity={0.35} />
              <Line type="monotone" dataKey="impairment_to_profit_ratio" name="减值/利润总额(%)" stroke={BB_COLORS.red} strokeWidth={2} dot={{ r: 3, fill: BB_COLORS.red }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderCashflow = () => (
    <>
      <div className="bb-card">
        <CardTitle color={BB_COLORS.green}>
          收现比 CASH_RECEIVED_RATIO (销售收现 / 营业收入)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={1} stroke={BB_COLORS.green} strokeDasharray="4 4" strokeWidth={1} opacity={0.7} label={{ value: '1.0', fill: BB_COLORS.green, fontSize: 10 }} />
              <Line type="monotone" dataKey="cash_received_ratio" name="收现比" stroke={BB_COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.purple}>
          付现比 CASH_PAID_RATIO (采购付现 / 营业成本)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={1} stroke={BB_COLORS.purple} strokeDasharray="4 4" strokeWidth={1} opacity={0.7} label={{ value: '1.0', fill: BB_COLORS.purple, fontSize: 10 }} />
              <Line type="monotone" dataKey="cash_paid_ratio" name="付现比" stroke={BB_COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.amber}>
          自由现金流 FREE_CASH_FLOW (OCF − CapEx)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={1} opacity={0.4} />
              <Bar
                dataKey="free_cash_flow"
                name="自由现金流"
                maxBarSize={45}
                shape={PosNegBarShape}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderOps = () => (
    <>
      <div className="bb-card">
        <CardTitle color={BB_COLORS.blue}>
          应收账款 AR_TURNOVER (左:周转天数 / 右:周转率)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: -10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis yAxisId="left" stroke={BB_COLORS.blue} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}天`} />
              <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.amber} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="ar_turnover_days" name="应收周转天数" stroke={BB_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="ar_turnover" name="应收周转率(次)" stroke={BB_COLORS.amber} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.purple}>
          存货 INVENTORY_TURNOVER (左:周转天数 / 右:周转率)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: -10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis yAxisId="left" stroke={BB_COLORS.purple} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}天`} />
              <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.amber} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="inventory_turnover_days" name="存货周转天数" stroke={BB_COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="inventory_turnover" name="存货周转率(次)" stroke={BB_COLORS.amber} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.cyan}>
          营业周期 OPERATING_CYCLE (应收天数 + 存货天数)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}天`} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="operating_cycle" name="营业周期(天)" stroke={BB_COLORS.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderSolvency = () => (
    <>
      <div className="bb-card">
        <CardTitle color={BB_COLORS.blue}>
          流动 / 速动比率 CURRENT & QUICK RATIO
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={2} stroke={BB_COLORS.blue} strokeDasharray="4 4" strokeWidth={1} opacity={0.55} label={{ value: '流动2.0', fill: BB_COLORS.blue, fontSize: 10 }} />
              <ReferenceLine y={1} stroke={BB_COLORS.green} strokeDasharray="4 4" strokeWidth={1} opacity={0.55} label={{ value: '速动1.0', fill: BB_COLORS.green, fontSize: 10 }} />
              <Line type="monotone" dataKey="current_ratio" name="流动比率" stroke={BB_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="quick_ratio" name="速动比率" stroke={BB_COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.amber}>
          资产负债率 ASSET_LIAB_RATIO (%)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="asset_liab_ratio" name="资产负债率(%)" stroke={BB_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bb-card">
        <CardTitle color={BB_COLORS.cyan}>
          现金比率 CASH_RATIO ((货币资金+交易性金融资产)/流动负债)
        </CardTitle>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
              <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
              <Tooltip content={<BloombergTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={0.2} stroke={BB_COLORS.cyan} strokeDasharray="4 4" strokeWidth={1} opacity={0.6} label={{ value: '0.2', fill: BB_COLORS.cyan, fontSize: 10 }} />
              <Line type="monotone" dataKey="cash_ratio" name="现金比率" stroke={BB_COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const tabContent = {
    earnings: renderEarnings,
    cashflow: renderCashflow,
    ops: renderOps,
    solvency: renderSolvency
  };

  return (
    <div className="glass-panel mb-4 w-full rounded-2xl p-4 font-mono sm:p-6">
      <div className="mb-5 flex flex-col gap-2 border-b border-cyan-400/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-base font-bold tracking-wide text-slate-100 sm:text-lg">
            <span style={{ color: BB_COLORS.blue }}>BBG_ANALYTICS:</span> INDUSTRIAL FINANCIAL MONITOR · {stockName}
          </h1>
          <p className="mt-1 text-xs" style={{ color: BB_COLORS.text }}>VIEW SOURCE: view_financial_data_industrial · 四大维度</p>
        </div>
        <div className="text-xs sm:text-right" style={{ color: BB_COLORS.amber }}>
          <span>TERMINAL MODE // SECURE_DATA_CONNECTED</span>
        </div>
      </div>

      <div className="chart-tabs" role="tablist" aria-label="财务分析维度">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`chart-tab${activeTab === tab.id ? ' chart-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="chart-tab-label">{tab.label}</span>
            <span className="chart-tab-en">{tab.en}</span>
          </button>
        ))}
      </div>

      <div className="chart-grid">
        {tabContent[activeTab]?.()}
      </div>
    </div>
  );
}
