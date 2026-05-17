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

const CurrentAssetChart = ({ data }) => {
  // 格式化函数：将原始数值转换为“亿”单位
  const toBillion = (val) => (val / 1e8).toFixed(1);

  return (
    <ChartCard title="流动资产分析" Icon={Coins}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="report_date" tick={{ fontSize: 12 }} tickFormatter={formatXAxis} />
        <YAxis 
          tickFormatter={(val) => `${Number((val / 1e8).toFixed(0))}亿`}
          tick={{ fontSize: 12 }} 
        />
        <Tooltip 
          formatter={(val, name) => [`${toBillion(val)} 亿元`, name]}
          cursor={{ fill: '#f8fafc' }}
        />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 14, paddingTop: 10 }}/>
        <Bar dataKey="currency_funds" stackId="a" fill="#aed6f1" name="货币资金" />
        <Bar dataKey="ar_and_br" stackId="a" fill="#5dade2" name="应收账款" />
        <Bar dataKey="inventory" stackId="a" fill="#85c1e9" name="存货" />
        <Bar dataKey="contractual_assets" stackId="a" fill="#3498db" name="合同资产" />
      </BarChart>
    </ChartCard>
  );
};

export default CurrentAssetChart;;