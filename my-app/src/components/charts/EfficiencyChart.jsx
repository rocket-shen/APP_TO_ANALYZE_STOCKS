// import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
// import { Activity } from 'lucide-react';
// import ChartCard from '../dashboard/ChartCard';

// const formatXAxis = (tickItem) => {
//   // 假设输入是 "2018-06-30"
//   if (!tickItem || typeof tickItem !== 'string') return tickItem;
//   const year = tickItem.substring(2, 4); // "18"
//   const month = tickItem.substring(5, 7); // "06"
//   return `${year}/${month}`;
// };


// const EfficiencyChart = ({ data }) => (
//   <ChartCard title="资产周转效率" Icon={Activity}>
//     <LineChart data={data}>
//       <CartesianGrid strokeDasharray="3 3" vertical={false} />
//       <XAxis dataKey="report_date" tick={{ fontSize: 12 }} tickFormatter={formatXAxis}/>
//       <YAxis tick={{ fontSize: 12 }} />
//       <Tooltip cursor={{ stroke: '#f59e0b', strokeWidth: 2 }} />
//       <Legend />
//       <Line 
//         type="step" 
//         dataKey="ar_turnover" 
//         stroke="#f59e0b" 
//         name="应收账款周转率" 
//         strokeWidth={2} 
//         dot={false}
//       />
//       <Line 
//         type="step" 
//         dataKey="inventory_turnover" 
//         stroke="#ec4899" 
//         name="存货周转率" 
//         strokeWidth={2} 
//         dot={false}
//       />
//     </LineChart>
//   </ChartCard>
// );

// export default EfficiencyChart;

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Activity } from 'lucide-react';
import ChartCard from '../dashboard/ChartCard';

const formatXAxis = (tickItem) => {
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  return `${tickItem.substring(2, 4)}/${tickItem.substring(5, 7)}`;
};

const EfficiencyChart = ({ data }) => {
  return (
    <ChartCard title="资产周转效率 (双轴)" Icon={Activity}>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="report_date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={formatXAxis} 
              axisLine={false}
              tickLine={false}
            />

            {/* 左侧 Y 轴：对应应收账款周转率 */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#f59e0b"
              tick={{ fontSize: 12, fill: '#f59e0b' }} 
              tickLine={false}
            />

            {/* 右侧 Y 轴：对应存货周转率 */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#ec4899"
              tick={{ fontSize: 12, fill: '#ec4899' }} 
              tickLine={false}
            />

            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="top" align="right" height={36}/>

            <Line 
              yAxisId="left"
              type="monotone" // 建议改用平滑曲线，看起来更直观
              dataKey="ar_turnover" 
              stroke="#f59e0b" 
              name="应收账款周转率" 
              strokeWidth={2} 
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="inventory_turnover" 
              stroke="#ec4899" 
              name="存货周转率" 
              strokeWidth={2} 
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default EfficiencyChart;