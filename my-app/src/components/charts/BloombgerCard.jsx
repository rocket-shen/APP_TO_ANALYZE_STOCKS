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
  purple: '#9933FF',     // 运营效率
  cyan: '#00B5E2',       // 补充色
  asset2: '#0A7FB3',     // 资产堆叠色1
  asset3: '#6C5CE7',     // 资产堆叠色2
  liab2: '#FF6B6B'       // 有息负债强调色
};

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

export default function BloombergChart({data}) {

  const stockName = data?.[0]?.stock_name;

  const toBillion = (val) => (val / 1e8).toFixed(1);
  return (
    <div className="glass-panel mt-8 mb-8 p-6 rounded-2xl border border-white/10 backdrop-blur-xl font-mono min-h-screen bg-slate-900 shadow-2xl shadow-cyan-500/10">
      
      {/* 顶栏控制台风格 Header */}
      <div style={{ borderBottom: `2px solid ${BB_COLORS.blue}`, paddingBottom: '10px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0', fontWeight: 'bold', letterSpacing: '1px' }}>
            <span style={{ color: BB_COLORS.blue }}>BBG_ANALYTICS:</span> INDUSTRIAL FINANCIAL MONITOR · {stockName}
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
              <ComposedChart data={data} margin={{ top: 10, right: -30, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis yAxisId="left" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`} />
                <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="营业收入" fill={BB_COLORS.blue} opacity={0.7} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="gross_margin" name="毛利率(%)" stroke={BB_COLORS.purple} strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARATER 净利润VS自由现金流 */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.amber}`, paddingLeft: '8px' }}>
            NET_PROFIT & CASH DIVERGENCE (净利润与自由现金流)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  {/* 经营现金流的渐变填充：健康色 */}
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  {/* 净利润的预警逻辑：如果净利润高于现金流，这里可以设置特殊的滤镜或颜色 */}
                  {/* 提示：高级预警通常结合 ComposeChart 使用，这里我们通过线条颜色区分 */}
                </defs>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="net_cash_flow_operating" name="经营现金流" stroke="#2dd4bf" fill="url(#colorCash)" strokeWidth={2} fillOpacity={1} />
                <Area type="monotone" dataKey="net_profit" name="净利润" stroke={BB_COLORS.purple} strokeWidth={1.5} fill="transparent" dot={{ r: 1.5, fill: '#818cf8', strokeWidth: 1, fillOpacity: 1 }} activeDot={{ r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHARATER  自由现金流 (FCF) 绝对值变动 */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.amber}`, paddingLeft: '8px' }}>
            FCF CASH-FLOW & DEBT CONVERGENCE ANALYSIS
          </h2>
          {/* 图表主区域 */}
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: -30, left: -10, bottom: 0 }}>
                {/* 严谨的极暗网格线 */}
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11, fontFamily: 'monospace' }} tickFormatter={formatXAxis}/>
                <YAxis 
                  yAxisId="left" 
                  stroke={BB_COLORS.text} 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${toBillion(val)}亿`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke={BB_COLORS.blue} 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${toBillion(val)}亿`}
                />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                {/* 1. 零轴参考线：如果FCF跌入地下（为负值），提供最显眼的水平基准 */}
                <ReferenceLine y={0} yAxisId="left" stroke="#FFFFFF" strokeWidth={1} opacity={0.4} />
                {/* 2. 自由现金流 (FCF) 绝对值变动：采用动态染色柱状图 */}
                <Bar 
                  yAxisId="left"
                  dataKey="free_cash_flow" 
                  name="自由现金流" 
                  maxBarSize={45}
                  // 经典彭博染色：正数显暗绿充当背景，负数（失血）显暗红
                    shape={(props) => {
                      const { x, y, width, height, value } = props;
                      const isPositive = value >= 0;
                      const fill = isPositive ? BB_COLORS.green : BB_COLORS.red;
                      // 修复负值渲染
                      const rectY = isPositive ? y : y + height;
                      const rectHeight = Math.abs(height);
                      return <rect x={x} y={rectY} width={width} height={rectHeight} fill={fill} opacity={0.8} />;
                    }}
                />
                {/* 3. 折线图A (左轴)：最终净利润，高亮穿梭看“剪刀差” */}
                <Line 
                  yAxisId="left" 
                  type="linear" 
                  dataKey="net_profit_atsopc" 
                  name="归母净利润" 
                  stroke={BB_COLORS.blue} 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: BB_COLORS.blue }}
                  activeDot={{ r: 5 }}
                />
                {/* 4. 折线图B (右轴)：有息负债总额，挂在高空透视风险对冲 */}
                <Line 
                  yAxisId="right" 
                  type="linear" 
                  dataKey="interest_bearing_liab" 
                  name="有息负债" 
                  stroke={BB_COLORS.amber} 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: BB_COLORS.amber }}
                  activeDot={{ r: 5 }}
                />
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
              <ComposedChart data={data} margin={{ top: 10, right: -20, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis yAxisId="left" stroke={BB_COLORS.blue} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.red} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                {/* 现金短债比采用面积图，低于1.0属于危险区域 */}
                <Area yAxisId="left" type="monotone" dataKey="cash_to_st_debt_ratio" name="现金短期债务比" fill={BB_COLORS.blue} stroke={BB_COLORS.blue} fillOpacity={0.15} />
                {/* 减值占比采用红线陡峭度表现 */}
                <Line yAxisId="right" type="monotone" dataKey="impairment_to_revenue_ratio" name="减值损失/营收比(%)" stroke={BB_COLORS.red} strokeWidth={0.5} dot={{ r: 2 }} />
                {/* 安全警戒线：现金短债比=1.0 */}
                <ReferenceLine y={1} yAxisId="left" stroke={BB_COLORS.blue} strokeWidth={1} opacity={0.4} />
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
              <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`} />
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
                    const isPositive = value >= 0;
                    const fill = isPositive ? BB_COLORS.green : BB_COLORS.red;
                    // 修复负值渲染
                    const rectY = isPositive ? y : y + height;
                    const rectHeight = Math.abs(height);
                    return <rect x={x} y={rectY} width={width} height={rectHeight} fill={fill} opacity={0.8} />;
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
              <LineChart data={data} margin={{ top: 10, right: -15, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis yAxisId="left" stroke={BB_COLORS.blue} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke={BB_COLORS.amber} tick={{ fontSize: 11 }} />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                <Line type="linear" yAxisId="left" dataKey="ar_turnover" name="应收账款周转率(次)" stroke={BB_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" yAxisId="right" dataKey="inventory_turnover" name="存货周转率(次)" stroke={BB_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 1. 三大核心利润率走势 (ROE、毛利率、净利率走势图) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.amber}`, paddingLeft: '8px' }}>
            5. PROFITABILITY MARGIN TRENDS (净资产收益率、毛利率、净利率 %)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 三线叠加，通过高对比度颜色看盈利效率的剪刀差 */}
                <Line type="linear" dataKey="roe" name="净资产收益率(ROE %)" stroke={BB_COLORS.amber} strokeWidth={1.5} dot={{ r: 2.5 }} />
                <Line type="linear" dataKey="gross_margin" name="营业毛利率(%)" stroke={BB_COLORS.blue} strokeWidth={1.5} dot={{ r: 2.5 }} />
                <Line type="linear" dataKey="net_profit_margin" name="营业净利率(%)" stroke={BB_COLORS.cyan} strokeWidth={1.5} dot={{ r: 2.5 }} />
                <ReferenceLine y={0} stroke="#FFFFFF" opacity={0.3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 核心利润 与 净利润 对比图 (柱线混排，看非经常损益或利息的剥离) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.green}`, paddingLeft: '8px' }}>
            6. CORE PROFIT VS NET PROFIT (核心主营利润与最终净利润对比)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`} />
                <Tooltip content={<BloombergTooltip />} formatter={(val, name) => [`${toBillion(val)} 亿元`, name]}/>
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 核心利润用柱状充当体量背景，净利润用高亮绿线穿梭，若绿线远低于柱状，说明存在大额营业外减值或利息剥离 */}
                <Bar dataKey="core_profit" name="核心主营利润" fill={BB_COLORS.blue} opacity={0.4} maxBarSize={45} />
                <Line type="monotone" dataKey="net_profit_atsopc" name="归母净利润" stroke={BB_COLORS.green} strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. 资产状况：固定资产、无形资产与总资产 (专业堆叠图) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.cyan}`, paddingLeft: '8px' }}>
            7. ASSET COMPOSITION ANALYSIS (总资产重轻资产分布结构)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`}/>
                <Tooltip content={<BloombergTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                
                {/* 采用堆叠Bar展示固定与无形，用虚线绳索牵引总资产顶端，一眼看出重资产扩张速度 */}
                <Bar dataKey="fixed_asset_sum" stackId="asset_stack" name="固定资产" fill={BB_COLORS.asset2} maxBarSize={45} />
                <Bar dataKey="intangible_assets" stackId="asset_stack" name="无形资产" fill={BB_COLORS.asset3} maxBarSize={45} />
                <Line type="linear" dataKey="total_assets" name="总资产" stroke={BB_COLORS.textMain} strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 负债状况：有息负债与总负债 (透视核心债务风险) */}
        <div style={{ backgroundColor: BB_COLORS.cardBg, padding: '15px', border: '1px solid #1F2633' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 15px 0', color: BB_COLORS.text, borderLeft: `3px solid ${BB_COLORS.red}`, paddingLeft: '8px' }}>
            8. DEBT RISK PROFILE (有息负债占总负债比重与违约隐患)
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke={BB_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="report_date" stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={formatXAxis} />
                <YAxis stroke={BB_COLORS.text} tick={{ fontSize: 11 }} tickFormatter={(val) => `${toBillion(val)}亿`}/>
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