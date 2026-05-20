import React from "react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import ChartCard from "../dashboard/ChartCard";

/** X轴日期格式化 2018-06-30 -> 18/06 */
const formatXAxis = (tickItem) => {
  if (!tickItem || typeof tickItem !== "string") return tickItem;
  const year = tickItem.substring(2, 4);
  const month = tickItem.substring(5, 7);
  return `${year}/${month}`;
};

const formatSmartUnit = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  const absVal = Math.abs(val);
  
  if (absVal >= 1e8) {
    return `${(val / 1e8).toFixed(2)}亿元`;
  } else if (absVal >= 1e6) {
    return `${(val / 1e6).toFixed(2)}百万`;
  } else if (absVal >= 1e4) {
    return `${(val / 1e4).toFixed(2)}万元`;
  }
  return `${val.toFixed(2)}元`;
};

const CashFlowFreeChart = ({ data }) => {
  return (
    <ChartCard title="自由现金流趋势" Icon={TrendingUp}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 0, left: -15, bottom: 0 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="#eee" 
        />

        <XAxis
          dataKey="report_date"
          tick={{ fontSize: 12 }}
          tickFormatter={formatXAxis}
          axisLine={{ stroke: '#ddd' }}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(val) => {
            const abs = Math.abs(val);
            if (abs >= 1e8) return `${(val / 1e8).toFixed(1)}亿`;
            if (abs >= 1e4) return `${(val / 1e4).toFixed(0)}万`;
            return val;
            }}
        />

        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: 8, borderColor: '#eee', fontSize: 12 }}
          formatter={(value) => [formatSmartUnit(value), "自由现金流"]}
        />

        <Legend 
          verticalAlign="bottom" 
          align="center" 
          wrapperStyle={{ fontSize: 14, paddingTop: 10 }}
        />

        {/* 柱状图：自由现金流 */}
        <Bar
            dataKey="free_cash_flow"
            fill="#60a5fa"
            name="自由现金流"
            barSize={20}
            // 如果你想让负值显示为红色，正值显示为蓝色，可以使用 Cell 映射
            >
            {data.map((entry, index) => (
                <Cell 
                key={`cell-${index}`} 
                fill={entry.free_cash_flow > 0 ? "#60a5fa" : "#fb7185"} 
                radius={entry.free_cash_flow > 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
                />
            ))}
            </Bar>

      </ComposedChart>
    </ChartCard>
  );
};

export default CashFlowFreeChart;