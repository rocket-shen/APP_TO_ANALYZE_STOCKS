import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Coins, AlertTriangle } from 'lucide-react';
import ChartCard from '../dashboard/ChartCard';

const formatXAxis = (tickItem) => {
  if (!tickItem || typeof tickItem !== 'string') return tickItem;
  return `${tickItem.substring(2, 4)}/${tickItem.substring(5, 7)}`;
};

const CashFlowQualityChart = ({ data }) => {
  const toBillion = (val) => (val / 1e8).toFixed(1);

  // 这里的核心逻辑：
  // 1. 使用 Area (面) 表示经营现金流 (net_cash_flow_operating)
  // 2. 使用 Line 风格的 Area (线) 表示净利润 (net_profit)
  // 3. 通过 SVG Gradient 实现动态预警
  
  return (
    <ChartCard title="利润含金量 (现金流 vs 净利润)" Icon={Coins}>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* 经营现金流的渐变填充：健康色 */}
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
              </linearGradient>
              
              {/* 净利润的预警逻辑：如果净利润高于现金流，这里可以设置特殊的滤镜或颜色 */}
              {/* 提示：高级预警通常结合 ComposeChart 使用，这里我们通过线条颜色区分 */}
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="report_date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={formatXAxis} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(val) => `${toBillion(val)}亿`} 
              tick={{ fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            
            <Tooltip 
              formatter={(val, name) => [`${toBillion(val)} 亿元`, name]}
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)' 
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 14, paddingTop: 3 }}/>

            {/* 1. 先画“面”：经营现金流 (作为底色) */}
            <Area
              type="monotone"
              dataKey="net_cash_flow_operating"
              stroke="#2dd4bf"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCash)"
              name="经营现金流"
            />

            {/* 2. 后画“线”：净利润 */}
            {/* 这里的 stroke 使用了动态判断逻辑的简化版：在高亮对比下观察 */}
            <Area
              type="monotone"
              dataKey="net_profit"
              stroke="#818cf8"  // 默认紫色
              strokeWidth={3}
              fill="transparent" // 净利润不填充，只做线条对比
              name="净利润"
              dot={{ r: 3, fill: '#818cf8', strokeWidth: 2, fillOpacity: 1 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default CashFlowQualityChart;