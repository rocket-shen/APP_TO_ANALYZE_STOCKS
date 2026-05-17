import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Coins } from 'lucide-react'; // 推荐使用 Coins 图标
import ChartCard from '../dashboard/ChartCard';

const formatXAxis = (tickItem) => {
  // 假设输入是 "2018-06-30"
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  const year = tickItem.substring(2, 4); // "18"
  const month = tickItem.substring(5, 7); // "06"
  return `${year}/${month}`;
};

const CashFlowChart = ({ data }) => {
  // 格式化函数：将原始数值转换为“亿”单位
  const toBillion = (val) => (val / 1e8).toFixed(1);

  return (
    <ChartCard title="利润含金量对比" Icon={Coins}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="report_date" tick={{ fontSize: 12 }} tickFormatter={formatXAxis} />
        <YAxis 
          tickFormatter={(val) => `${toBillion(val)}亿`} 
          tick={{ fontSize: 12 }} 
        />
        <Tooltip 
          formatter={(val, name) => [`${toBillion(val)} 亿元`, name]}
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)' 
              }}
        />
        <Legend verticalAlign="bottom" height={36} />
        <Bar 
          dataKey="net_profit" 
          fill="#818cf8" 
          name="净利润" 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
        <Bar 
          dataKey="net_cash_flow_operating" 
          fill="#2dd4bf" 
          name="经营现金流" 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
      </BarChart>
    </ChartCard>
  );
};

export default CashFlowChart;