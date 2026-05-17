import { ShieldAlert } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartCard from '../dashboard/ChartCard'; // 引入刚才创建的组件

const formatXAxis = (tickItem) => {
  // 假设输入是 "2018-06-30"
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  const year = tickItem.substring(2, 4); // "18"
  const month = tickItem.substring(5, 7); // "06"
  return `${year}/${month}`;
};

const DebtRiskChart = ({ data }) => (
  <ChartCard title="偿债风险监测" Icon={ShieldAlert}>
    {/* 这里直接写图表逻辑，外层高度已由 ChartCard 处理 */}
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
      <XAxis dataKey="report_date" tick={{fontSize: 12}} tickFormatter={formatXAxis} />
      <YAxis yAxisId="left" tick={{fontSize: 12}}/>
      <Tooltip contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)' 
              }}/>
      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 14, paddingTop: 10 }}/>
      <Bar yAxisId="left" dataKey="current_ratio" fill="#94a3b8" name="流动比率" />
      <Line type="monotone" dataKey="asset_liab_ratio" stroke="#ef4444" name="负债率 %" />
    </ComposedChart>
  </ChartCard>
);

export default DebtRiskChart;