import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Legend } from 'recharts';
import { Coins } from 'lucide-react'; // 推荐使用 Coins 图标
import ChartCard from '../dashboard/ChartCard';

const formatXAxis = (tickItem) => {
  // 假设输入是 "2018-06-30"
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  const year = tickItem.substring(2, 4); // "18"
  const month = tickItem.substring(5, 7); // "06"
  return `${year}/${month}`;
};

const CashPaidReceivedChart = ({ data }) => {

  return (
    <ChartCard title="现金收支对比" Icon={Coins}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
            dataKey="report_date" 
            tick={{ fontSize: 11 }} 
            tickFormatter={formatXAxis} 
            axisLine={{ stroke: '#eee' }}
          />
        <YAxis 
          tick={{ fontSize: 12 }} 
          domain={[0.5, 'auto']} 
          allowDecimals={true}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine 
            y={1} 
            stroke="#94a3b8" 
            strokeDasharray="5 5" 
            label={{ position: 'right', value: '1.0', fill: '#94a3b8', fontSize: 10 }} 
          />

        <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
            // 格式化 Tooltip 显示百分比或保留两位小数
            formatter={(val, name) => [val.toFixed(2), name]}
            />
        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 14, paddingTop: 3 }} />
        <Bar 
            dataKey="cash_received_ratio" 
            fill="#818cf8" 
            name="收现比" 
            radius={[2, 2, 0, 0]} 
            barSize={12} // 💡 调小 barSize 让图面不那么拥挤
          />
          <Bar 
            dataKey="cash_paid_ratio" 
            fill="#2dd4bf" 
            name="付现比" 
            radius={[2, 2, 0, 0]} 
            barSize={12}
          />
      </BarChart>
    </ChartCard>
  );
};

export default CashPaidReceivedChart;