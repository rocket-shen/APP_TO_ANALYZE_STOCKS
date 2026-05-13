import React from "react";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from "recharts";
import { TrendingUp } from "lucide-react";
import ChartCard from "../dashboard/ChartCard";

/** X轴日期格式化 2018-06-30 -> 18/06 */
const formatXAxis = (tickItem) => {
  if (!tickItem || typeof tickItem !== "string") return tickItem;
  const year = tickItem.substring(2, 4);
  const month = tickItem.substring(5, 7);
  return `${year}/${month}`;
};

/** 单位转换：元 -> 亿 */
const toBillion = (val) => {
  if (val === null || val === undefined) return "-";
  return (val / 1e8).toFixed(1);
};

const toPercent = (val) => {
  if (val === null || val === undefined) return "-";
  return Number(val * 100).toFixed(2);
};

const RevenueChart = ({ data }) => {
  return (
    <ChartCard title="营业收入趋势" Icon={TrendingUp}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 0, left: 0, bottom: 10 }}
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

        {/* 左轴：营业收入（亿） */}
        <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => `${Number((val / 1e8).toFixed(0))}亿`}
            axisLine={{ stroke: '#60a5fa' }}  // 👈 左轴颜色呼应柱状图
            tickLine={{ stroke: '#60a5fa' }}
        />

        {/* 右轴：同比增长（%） */}
        <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => `${Number((val * 100).toFixed(0))}%`}
            axisLine={{ stroke: '#9b6603' }}  // 👈 右轴颜色呼应折线图
            tickLine={{ stroke: '#9b6603' }}
        />

        <Tooltip
            formatter={(value, name) => {
            if (name === "营业收入") {
                return [`${toBillion(value)} 亿元`, name];
            }
            return [`${toPercent(value)}%`, name];
            }}
        />

        <Legend 
          verticalAlign="bottom" 
          align="center" 
          wrapperStyle={{ fontSize: 14, paddingTop: 10 }}
        />

        {/* 柱状图：营业收入 */}
        <Bar
          yAxisId="left"
          dataKey="revenue"
          fill="#60a5fa"
          name="营业收入"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />

        {/* 趋势线 */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue_yoy"
          stroke="#9b6603ff"
          strokeWidth={2}
          dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          name="收入同比"
        />
      </ComposedChart>
    </ChartCard>
  );
};

export default RevenueChart;