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
    <div className="glass-panel group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl shadow-black/80 hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5">
      
      {/* 卡片頭部 */}
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/50 transition-colors">
            <Icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
        )}
        
        <h3 className="font-semibold text-xl text-white tracking-tight">
          {title}
        </h3>
      </div>

      {/* 圖表區域 */}
      <div className="h-80 w-full min-h-[320px] relative">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>

      {/* 底部科技感裝飾線 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
    </div>
  );
};

export default ChartCard;