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

const toBillion = (val) => {
  if (val === null || val === undefined) return "-";
  return (val / 1e8).toFixed(1);
};

const AssetTrendChart = ({ data }) => (
  <ChartCard title="资产趋势" Icon={TrendingUp}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
      <XAxis dataKey="report_date" tick={{fontSize: 12}} tickFormatter={formatXAxis} />
      <YAxis 
        tickFormatter={(val) => `${Number((val / 1e8).toFixed(0))}亿`}
        tick={{ fontSize: 12 }} 
        />
      <Tooltip 
        formatter={(val, name) => [`${toBillion(val)} 亿元`, name]}
        cursor={{ fill: '#f8fafc' }}
        />
      <Legend verticalAlign="bottom" height={36} />
      <Line type="monotone" dataKey="total_assets" stroke="#6366f1" name="总资产" strokeWidth={2} />
      <Line type="monotone" dataKey="total_liab" stroke="#10b981" name="总负债" strokeWidth={2} />
      <Line type="monotone" dataKey="total_current_liab" stroke="#f59e0b" name="流动负债" strokeWidth={2} />
      <Line type="monotone" dataKey="total_current_assets" stroke="#145a6bff" name="流动资产" strokeWidth={2} />
    </LineChart>
  </ChartCard>
);

export default AssetTrendChart;