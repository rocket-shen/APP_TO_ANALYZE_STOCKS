import { quoteFields } from "../../config/quoteFields"

const DashboardHeader = ({ quote }) => {

  const now = new Date();
  
  // 1. 格式化函数：处理数字、单位、百分比、正负号
  const formatValue = (value, fieldKey) => {
    // 空值处理
    if (value === null || value === undefined || value === '') return "--";

    // --- 特殊字段：百分比类 (涨跌幅、换手率、振幅) ---
    const percentFields = ['percent', 'turnover_rate', 'amplitude', 'current_year_percent', 'dividend_yield','pledge_ratio'];
    if (percentFields.includes(fieldKey)) {
      // 如果是涨跌幅，根据正负添加颜色类名或符号 (这里仅做文本格式化)
      const sign = value > 0 ? '+' : '';
      return `${sign}${value}%`;
    }

    // --- 特殊字段：涨跌额 (添加 + 号) ---
    if (fieldKey === 'chg') {
      const sign = value > 0 ? '+' : '';
      return `${sign}${value}`;
    }

    // --- 特殊字段：价格与比率 (保留 2 位小数，不加单位) ---
    const ratioFields = ['current', 'pe_ttm', 'pb', 'eps', 'navps', 'high52w', 'low52w', 'open', 'high', 'low', 'last_close','goodwill_in_net_assets'];
    if (ratioFields.includes(fieldKey)) {
      return Number(value).toFixed(2);
    }

    // --- 默认：大数字格式化 (市值、成交量、成交额等) ---
    // 注意：新数据中股本 (shares) 通常很大，也走这个逻辑
    if (value >= 1e12) return (value / 1e12).toFixed(2) + "万亿";
    if (value >= 1e8) return (value / 1e8).toFixed(2) + "亿";
    if (value >= 1e4) return (value / 1e4).toFixed(2) + "万";

    return value.toLocaleString();
  };

  // 2. 数据映射：直接读取根属性
  const entries = Object.entries(quoteFields).map(([field, label]) => ({
    field,
    label,
    value: quote?.[field] // 扁平结构，直接访问
  }));

  const colorFields = ['percent', 'chg', 'current','current_year_percent'];

  const getColorClass = (field, value) => {

    if (!colorFields.includes(field)) return null;

    const num = parseFloat(value);

    if (num > 0) return "text-red-500";
    if (num < 0) return "text-green-500";

    return null;
  };


  return (
    <div className="mb-6 border-b border-slate-200 pb-4">
      
      {/* 标题区域 */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
            股票报价
          </div>

          <h2 className="text-2xl font-bold text-slate-300">
            {quote?.name || '未知股票'}
          </h2>
        </div>

        <div className="text-sm text-slate-500">
          更新时间：
          {now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
          {' '}
          {now.toLocaleDateString('zh-CN', {
            weekday: 'long'
          })}
        </div>

      </div>
      {/* 数据网格区域 */}
      <div className="exchange-data-container mt-6">
        <div className="exchange-data-grid grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 text-sm">
          {entries.map(({ field, label, value }) => (
            <div key={field} className="flex flex-col">
              {/* 标签 */}
              <span className="text-slate-500 mb-1">
                {label}
              </span>
              
              {/* 数值 */}
              <span className={`font-semibold ${getColorClass(field, value) || 'text-slate-300'}`}>
                {formatValue(value, field)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
