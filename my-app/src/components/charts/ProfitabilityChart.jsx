import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import ChartCard from '../dashboard/ChartCard';

const formatXAxis = (tickItem) => {
  // 假设输入是 "2018-06-30"
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  const year = tickItem.substring(2, 4); // "18"
  const month = tickItem.substring(5, 7); // "06"
  return `${year}/${month}`;
};

const ProfitabilityChart = ({ data }) => (
  <ChartCard title="盈利能力趋势" Icon={TrendingUp}>
    <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
      <XAxis dataKey="report_date" tick={{fontSize: 12}} tickFormatter={formatXAxis} padding={{ left: 10, right: 10 }} />
      <YAxis tick={{fontSize: 12}} />
      <Tooltip contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)' 
              }}/>
      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 14, paddingTop: 10 }}/>
      <Line type="monotone" dataKey="roe" stroke="#6366f1" name="ROE %" strokeWidth={2} />
      <Line type="monotone" dataKey="gross_margin" stroke="#10b981" name="毛利率 %" strokeWidth={2} />
      <Line type="monotone" dataKey="net_profit_margin" stroke="#f59e0b" name="净利率 %" strokeWidth={2} />
    </LineChart>
  </ChartCard>
);

export default ProfitabilityChart;