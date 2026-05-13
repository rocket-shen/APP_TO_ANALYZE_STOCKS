import React, { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, ShieldAlert, Activity } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      {/* 顶部搜索栏 */}
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-extrabold mb-6 text-slate-800">股票财务透视</h1>
        <div className="flex gap-2 max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="输入股票代码 (如: 600519)"
            className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            onClick={() => handleSearch(symbol)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md disabled:bg-blue-300"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            查询
          </button>
        </div>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>

      {data.length > 0 && (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3">
              {data[0].stock_name} ({symbol}) 分析报告
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 盈利能力图表 */}
            <ChartCard title="盈利能力趋势" Icon={TrendingUp}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="report_date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="roe" stroke="#6366f1" name="ROE %" strokeWidth={2} dot={{r:4}} />
                <Line type="monotone" dataKey="gross_margin" stroke="#10b981" name="毛利率 %" strokeWidth={2} />
              </LineChart>
            </ChartCard>

            {/* 安全边际图表 */}
            <ChartCard title="偿债风险监测" Icon={ShieldAlert}>
              <ComposedChart data={data}>
                <CartesianGrid stroke="#eee" vertical={false} />
                <XAxis dataKey="report_date" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="current_ratio" fill="#94a3b8" name="流动比率" barSize={15} />
                <Line yAxisId="right" type="monotone" dataKey="asset_liab_ratio" stroke="#ef4444" name="负债率 %" strokeWidth={2} />
              </ComposedChart>
            </ChartCard>

            {/* 营运效率图表 */}
            <ChartCard title="资产周转效率" Icon={Activity}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="report_date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="step" dataKey="ar_turnover" stroke="#f59e0b" name="应收账款周转率" strokeWidth={2} />
                <Line type="step" dataKey="inventory_turnover" stroke="#ec4899" name="存货周转率" strokeWidth={2} />
              </LineChart>
            </ChartCard>

            {/* 利润含金量图表 */}
            <ChartCard title="净利润与现金流对比">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="report_date" tick={{fontSize: 12}}/>
                <YAxis tickFormatter={(val) => (val/1e8).toFixed(0) + '亿'}  tick={{fontSize: 12}}/>
                <Tooltip formatter={(val) => (val/1e8).toFixed(2) + ' 亿'} />
                <Legend />
                <Bar dataKey="net_profit_atsopc" fill="#818cf8" name="归母净利润" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_cash_flow_operating" fill="#2dd4bf" name="经营现金流" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

// 子组件：图表卡片容器
const ChartCard = ({ title, children, Icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-6 text-slate-700">
      {Icon && <Icon className="w-5 h-5 text-blue-500" />}
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <div className="h-72 w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export default FinancialDashboard;