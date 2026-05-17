import React from 'react';
import { ResponsiveContainer } from 'recharts';

const ChartCard = ({ title, children, Icon }) => {
  return (
    <div className="
      relative
      flex flex-col /* 如果是图表卡片，建议加上布局控制 */
      bg-white/5 
      backdrop-blur-2xl 
      border 
      border-white/10 
      rounded-2xl 
      px-5 
      pt-4 
      pb-3 
      overflow-hidden 
      transition-all 
      duration-300
      hover:border-cyan-400/40
    ">

      {/* 頂部橙色標識線 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2">

          {/* Icon */}
          {Icon && (
            <div className="
              flex items-center justify-center
              w-6 h-6
              text-orange-400
            ">
              <Icon className="w-4 h-4" />
            </div>
          )}

          {/* Title */}
          <h3 className="
            text-sm
            font-semibold
            tracking-wide
            uppercase
            text-neutral-100
          ">
            {title}
          </h3>
        </div>

        {/* Bloomberg 小標籤 */}
        <div className="
          text-[10px]
          text-orange-500
          font-mono
          tracking-wider
        ">
          BLOOMBERG
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>

      {/* Bottom subtle border */}
      <div className="
        absolute
        bottom-0
        left-0
        right-0
        h-px
        bg-neutral-800
      " />
    </div>
  );
};

export default ChartCard;