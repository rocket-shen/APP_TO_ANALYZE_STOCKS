import React from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * ChartCard - 图表统一包装容器
 * @param {string} title - 图表标题
 * @param {ReactElement} children - Recharts 图表组件 (LineChart, BarChart 等)
 * @param {LucideIcon} Icon - 来自 lucide-react 的图标组件 (可选)
 */
const ChartCard = ({ title, children, Icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
      {/* 头部区域：图标 + 标题 */}
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        {Icon && (
          <Icon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
        )}
        <h3 className="font-bold text-lg tracking-tight text-slate-800">
          {title}
        </h3>
      </div>

      {/* 图表渲染区域 */}
      {/* ResponsiveContainer 是关键，它让图表能够响应式缩放 */}
      <div className="h-72 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;