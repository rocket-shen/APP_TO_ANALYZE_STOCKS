import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  AreaChart,
  Line,
  Bar,
  Area,
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
  bg: '#0B0E14',         // 终端深色背景
  cardBg: '#12161F',     // 看板卡片背景
  grid: '#222A36',       // 网格线
  text: '#A3B1C2',       // 辅助文字
  textMain: '#FFFFFF',   // 主文字
  blue: '#0055FF',       // 彭博标准蓝 (主营收入/正资产)
  amber: '#FF9900',      // 终端琥珀金 (利润率/核心指标)
  green: '#00C261',      // 现金流/安全垫 (正向)
  red: '#FF3344',        // 减值/负债 (风险)
  purple: '#9933FF'      // 运营效率
};

// ==========================================
// 模拟前端接收到的 View 数据 (历年/历季数据)
// ==========================================
const mockViewData = [
  { report_date: '2021-12-31', revenue: 1000, net_profit: 150, gross_margin: 25.4, net_profit_margin: 15.0, free_cash_flow: 180, ar_turnover: 5.2, inventory_turnover: 4.1, net_supply_chain_capital_occupied: 50, cash_to_st_debt_ratio: 1.5, impairment_to_revenue_ratio: 0.8 },
  { report_date: '2022-12-31', revenue: 1200, net_profit: 180, gross_margin: 26.1, net_profit_margin: 15.0, free_cash_flow: 210, ar_turnover: 5.5, inventory_turnover: 4.3, net_supply_chain_capital_occupied: 80, cash_to_st_debt_ratio: 1.8, impairment_to_revenue_ratio: 0.5 },
  { report_date: '2023-12-31', revenue: 1500, net_profit: 90,  gross_margin: 22.0, net_profit_margin: 6.0,  free_cash_flow: -50, ar_turnover: 4.1, inventory_turnover: 3.2, net_supply_chain_capital_occupied: -20, cash_to_st_debt_ratio: 0.8, impairment_to_revenue_ratio: 4.5 }, // 模拟爆雷年
  { report_date: '2024-12-31', revenue: 1400, net_profit: 120, gross_margin: 24.5, net_profit_margin: 8.5,  free_cash_flow: 130, ar_turnover: 4.8, inventory_turnover: 3.9, net_supply_chain_capital_occupied: 30, cash_to_st_debt_ratio: 1.2, impairment_to_revenue_ratio: 1.2 },
  { report_date: '2025-12-31', revenue: 1800, net_profit: 260, gross_margin: 28.2, net_profit_margin: 14.4, free_cash_flow: 310, ar_turnover: 6.1, inventory_turnover: 4.8, net_supply_chain_capital_occupied: 120, cash_to_st_debt_ratio: 2.3, impairment_to_revenue_ratio: 0.4 },
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
            <span style={{ color: item.color || item.fill }}>{item.name.toUpperCase()}:</span>
            <span style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
              {typeof item.value === 'number' ? item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function BloombergFinancialDashboard() {
  const [data] = useState(mockViewData);

  return (
    <div style={{ backgroundColor: BB_COLORS.bg, color: BB_COLORS.textMain, padding: '20px', fontFamily: 'monospace', minHeight: '100vh' }}>
      
      {/* 顶栏控制台风格 Header */}
      <div style={{ borderBottom: `2px solid ${BB_COLORS.blue}`, paddingBottom: '10px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0', fontWeight: 'bold', letterSpacing: '1px' }}>
            <span style={{ color: BB_COLORS.blue }}>BBG_ANALYTICS:</span> INDUSTRIAL FINANCIAL MONITOR
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: BB_COLORS.text }}>VIEW SOURCE: view_financial_data_industrial</p>
        </div>
        <div style={{ fontSize: '12px', color: BB_COLORS.amber, textAlign: 'right' }}>
          <span>TERMINAL MODE // SECURE_DATA_CONNECTED</span>
        </div>
      </div>

      {/* 四宫格看盘核心布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))', gap: '20px' }}>
        
        {/* CHARATER 1: 盈利质量与造血背离分析 (关键：看净利润与自由现金流是否同步) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.amber}`, paddingLeft: '8px' }}>
            1. EARNINGS & CASH DIVERGENCE (营收、利润与自由现金流)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                <Bar yAxisId="left" dataKey="revenue" name="营业收入" fill={BB_COLORS.blue} opacity={0.7} maxBarSize={40} />
                <Line yAxisId="left" type="monotone" dataKey="net_profit" name="净利润" stroke={BB_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="free_cash_flow" name="自由现金流[完善版]" stroke={BB_COLORS.green} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="gross_margin" name="毛利率(%)" stroke={BB_COLORS.purple} strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARATER 2: 风险防御垫与减值分析 (关键：看现金能否覆盖短债，减值是否吞噬营收) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.red}`, paddingLeft: '8px' }}>
            2. CREDIT RISK & IMPAIRMENT MONITOR (暴雷防线与资产减值)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 现金短债比采用面积图，低于1.0属于危险区域 */}
                <Area yAxisId="left" type="monotone" dataKey="cash_to_st_debt_ratio" name="现金短期债务比" fill={BB_COLORS.blue} stroke={BB_COLORS.blue} fillOpacity={0.15} />
                {/* 减值占比采用红线陡峭度表现 */}
                <Line yAxisId="right" type="monotone" dataKey="impairment_to_revenue_ratio" name="减值损失/营收比(%)" stroke={BB_COLORS.red} strokeWidth={2.5} dot={{ r: 4 }} />
                {/* 安全警戒线：现金短债比=1.0 */}
                <ReferenceLine yAxisId="left" y={1.0} stroke={BB_COLORS.red} strokeDasharray="3 3" label={{ value: 'DEBT CRITICAL LINE (1.0)', fill: BB_COLORS.red, fontSize: 10, position: 'insideBottomLeft' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARATER 3: 供应链资本占用分析 (关键：零轴线之上的正数代表免费白嫖上下游资金) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.green}`, paddingLeft: '8px' }}>
            3. SUPPLY CHAIN MOAT (正负零轴：净占用上下游资金差额)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 采用正负柱状图，直观体现话语权切换 */}
                <Bar 
                  dataKey="net_supply_chain_capital_occupied" 
                  name="净占用上下游资金" 
                  maxBarSize={45}
                  // 动态颜色：正数白嫖显绿色，负数受气显红色
                  shape={(props) => {
                    const { x, y, width, height, value } = props;
                    const fill = value >= 0 ? BB_COLORS.green : BB_COLORS.red;
                    return <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.8} />;
                  }}
                />
                <ReferenceLine y={0} stroke="#FFFFFF" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARATER 4: 资产运营效率修正走势 (关键：平均值修正后的应收及存货周转效率) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.purple}`, paddingLeft: '8px' }}>
            4. ASSET TURNOVER EFFICIENCY (均值修正：应收及存货周转率)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                <Line type="linear" dataKey="ar_turnover" name="应收账款周转率(次)" stroke={BB_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" dataKey="inventory_turnover" name="存货周转率(次)" stroke={BB_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 1. 三大核心利润率走势 (ROE、毛利率、净利率走势图) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.amber}`, paddingLeft: '8px' }}>
            1. PROFITABILITY MARGIN TRENDS (净资产收益率、毛利率、净利率 %)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 三线叠加，通过高对比度颜色看盈利效率的剪刀差 */}
                <Line type="linear" dataKey="roe" name="净资产收益率(ROE %)" stroke={BB_COLORS.amber} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="linear" dataKey="gross_margin" name="营业毛利率(%)" stroke={BB_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" dataKey="net_profit_margin" name="营业净利率(%)" stroke={BB_COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
                <ReferenceLine y={0} stroke="#FFFFFF" opacity={0.3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 核心利润 与 净利润 对比图 (柱线混排，看非经常损益或利息的剥离) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.green}`, paddingLeft: '8px' }}>
            2. CORE PROFIT VS NET PROFIT (核心主营利润与最终净利润对比)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 核心利润用柱状充当体量背景，净利润用高亮绿线穿梭，若绿线远低于柱状，说明存在大额营业外减值或利息剥离 */}
                <Bar dataKey="core_profit" name="核心主营利润" fill={BB_COLORS.blue} opacity={0.4} maxBarSize={45} />
                <Line type="monotone" dataKey="net_profit" name="最终净利润" stroke={BB_COLORS.green} strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. 资产状况：固定资产、无形资产与总资产 (专业堆叠图) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.cyan}`, paddingLeft: '8px' }}>
            3. ASSET COMPOSITION ANALYSIS (总资产重轻资产分布结构)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 采用堆叠Bar展示固定与无形，用虚线绳索牵引总资产顶端，一眼看出重资产扩张速度 */}
                <Bar dataKey="fixed_assets" stackId="asset_stack" name="固定资产" fill={BB_COLORS.asset2} maxBarSize={45} />
                <Bar dataKey="intangible_assets" stackId="asset_stack" name="无形资产" fill={BB_COLORS.asset3} maxBarSize={45} />
                <Line type="linear" dataKey="total_assets" name="总资产" stroke={BB_COLORS.textMain} strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 负债状况：有息负债与总负债 (透视核心债务风险) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.red}`, paddingLeft: '8px' }}>
            4. DEBT RISK PROFILE (有息负债占总负债比重与违约隐患)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 有息负债（通常包含短期借款 st_loan、长期借款等）用深浅不同的红色堆叠和衬托，看刚性债务占比 */}
                <Bar dataKey="interest_bearing_liab" name="刚性有息负债" fill={BB_COLORS.liab2} maxBarSize={45} />
                <Line type="linear" dataKey="total_liab" name="总负债" stroke={BB_COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 底部免责与彭博控制台命令行提示 */}
      <div style={{ marginTop: '25px', padding: '10px', borderTop: `1px solid ${BB_COLORS.grid}`, fontSize: '11px', color: '#556677', display: 'flex', justifyContent: 'space-between' }}>
        <span>BBG-ANALYST-ID: 998273 // INDUSTRIAL_VIEW_MODEL_V2</span>
        <span>GO TO FINANCIAL ANALYSIS RUN [ENTER]</span>
      </div>
    </div>
  );
}