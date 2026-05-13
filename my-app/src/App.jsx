import React, { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, ShieldAlert, Activity, BarChart3 } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';

const FinancialDashboard = () => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/financial_data/${symbol}`);
      const result = await response.json(); // 现在 result 始终是数组 [] 或 [{...}]
      console.log("API 返回数据:", result);

      if (result.length === 0) {
        setError(`未找到代码 ${symbol} 的财务数据`);
        setData([]);
      } else {
        // 这里的 result 绝对是数组，可以直接 reverse 和展开
        setData([...result].reverse());
      }
    } catch (err) {
      setError("获取数据失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  // 处理回车键
  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(symbol);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">

      {/* 背景光晕 */}
      <div className="absolute top-0 left-0 w-125 h-125 bg-blue-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-100 h-100 bg-cyan-500/10 blur-3xl rounded-full" />

      <div className="relative z-10 px-6 py-10">

        {/* Header */}
        <div className="max-w-5xl mx-auto mb-14 text-center">

          <div className="inline-flex items-center gap-3 mb-5 px-5 py-2 rounded-full bg-slate-800/60 border border-slate-700 backdrop-blur">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span className="text-sm tracking-wide text-slate-300">
              A股财务分析系统
            </span>
          </div>

          <h1 className="text-5xl font-black mb-5 tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            股票财务透视
          </h1>

          <p className="text-slate-400 text-lg mb-10">
            资产质量 · 盈利能力 · 现金流 · 偿债风险
          </p>

          {/* 搜索栏 */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 bg-slate-900/60 border border-slate-700 p-3 rounded-2xl backdrop-blur-xl shadow-2xl">

              <input
                type="text"
                placeholder="输入股票代码，例如：600519"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={onKeyDown}
                className="
                  flex-1
                  bg-transparent
                  px-4
                  py-3
                  text-lg
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                "
              />

              <button
                onClick={() => handleSearch(symbol)}
                disabled={loading}
                className="
                  px-6
                  py-3
                  rounded-xl
                  bg-linear-to-r
                  from-blue-500
                  to-cyan-500
                  hover:scale-105
                  transition-all
                  duration-300
                  font-semibold
                  shadow-lg
                  shadow-cyan-500/20
                  flex
                  items-center
                  gap-2
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                查询
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* 数据区 */}
        {data.length > 0 && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">

            {/* 标题 */}
            <div className="mb-10 flex items-center justify-between">

              <div>
                <h2 className="text-3xl font-bold text-white">
                  {data[0].stock_name}
                </h2>

                <p className="text-slate-400 mt-2">
                  股票代码：{symbol}
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm">
                  财务数据已加载
                </span>
              </div>
            </div>

            {/* 图表 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              {/* 盈利能力 */}
              <ChartCard title="盈利能力趋势" Icon={TrendingUp}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="report_date"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="roe"
                    stroke="#6366f1"
                    name="ROE %"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="gross_margin"
                    stroke="#10b981"
                    name="毛利率 %"
                    strokeWidth={3}
                  />
                </LineChart>
              </ChartCard>

              {/* 偿债风险 */}
              <ChartCard title="偿债风险监测" Icon={ShieldAlert}>
                <ComposedChart data={data}>
                  <CartesianGrid stroke="#334155" />
                  <XAxis
                    dataKey="report_date"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <Tooltip />
                  <Legend />

                  <Bar
                    yAxisId="left"
                    dataKey="current_ratio"
                    fill="#64748b"
                    name="流动比率"
                    radius={[4, 4, 0, 0]}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="asset_liab_ratio"
                    stroke="#ef4444"
                    name="负债率 %"
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ChartCard>

              {/* 周转效率 */}
              <ChartCard title="资产周转效率" Icon={Activity}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                  <XAxis
                    dataKey="report_date"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />

                  <Tooltip />
                  <Legend />

                  <Line
                    type="step"
                    dataKey="ar_turnover"
                    stroke="#f59e0b"
                    name="应收账款周转率"
                    strokeWidth={3}
                  />

                  <Line
                    type="step"
                    dataKey="inventory_turnover"
                    stroke="#ec4899"
                    name="存货周转率"
                    strokeWidth={3}
                  />
                </LineChart>
              </ChartCard>

              {/* 利润现金流 */}
              <ChartCard title="利润与现金流" Icon={BarChart3}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                  <XAxis
                    dataKey="report_date"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <YAxis
                    tickFormatter={(val) => (val / 1e8).toFixed(0) + '亿'}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />

                  <Tooltip
                    formatter={(val) =>
                      (val / 1e8).toFixed(2) + ' 亿'
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="net_profit_atsopc"
                    fill="#818cf8"
                    name="归母净利润"
                    radius={[4, 4, 0, 0]}
                  />

                  <Bar
                    dataKey="net_cash_flow_operating"
                    fill="#2dd4bf"
                    name="经营现金流"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, Icon }) => (
  <div
    className="
      bg-white/5
      border
      border-white/10
      backdrop-blur-xl
      rounded-3xl
      p-6
      shadow-2xl
      hover:border-cyan-400/30
      hover:shadow-cyan-500/10
      transition-all
      duration-500
    "
  >
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2 rounded-xl bg-cyan-500/10">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
      )}

      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>
    </div>

    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export default FinancialDashboard;