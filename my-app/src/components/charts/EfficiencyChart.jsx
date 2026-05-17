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
          <LineChart 
            data={data} 
            /* 1. 这里的 left 改为负值（例如 -20），可以抵消 YAxis 占据的空白 */
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            
            <XAxis 
              dataKey="report_date" 
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
              tickFormatter={formatXAxis} 
              axisLine={false}
              tickLine={false}
              /* 2. 这里的 padding 让折线图的首尾点更靠近边缘 */
              padding={{ left: 10, right: 10 }}
            />

            {/* 左侧 Y 轴 */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              stroke="#f59e0b"
              tick={{ fontSize: 10, fill: '#f59e0b' }} 
              tickLine={false}
              axisLine={false}
              /* 3. 强制限制宽度，避免它撑开容器 */
              width={45} 
            />

            {/* 右侧 Y 轴 */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#ec4899"
              tick={{ fontSize: 10, fill: '#ec4899' }} 
              tickLine={false}
              axisLine={false}
              /* 3. 同样限制宽度 */
              width={45} 
            />

            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)' 
              }}
            />
            
            {/* 4. Legend 增加 negative margin 稍微上移，节省空间 */}
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingBottom: 20, right: 0 }}
            />

            <Line 
              yAxisId="left"
              type="monotone"
              dataKey="ar_turnover" 
              stroke="#f59e0b" 
              name="应收账款周转率" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#f59e0b' }}
              activeDot={{ r: 4 }}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="inventory_turnover" 
              stroke="#ec4899" 
              name="存货周转率" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#ec4899' }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default EfficiencyChart;