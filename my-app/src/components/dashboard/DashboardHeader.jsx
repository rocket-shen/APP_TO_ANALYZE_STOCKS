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

  const current = quote?.current;
  const percent = quote?.percent;
  const chg = quote?.chg;
  const priceColor = getColorClass('current', current) || 'text-slate-100';
  const changeColor = getColorClass('percent', percent) || 'text-slate-300';

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-cyan-400/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-300">
              股票报价
            </span>
            {quote?.symbol || quote?.code ? (
              <span className="num rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
                {quote?.symbol || quote?.code}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              {quote?.name || '未知股票'}
            </h2>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={`num text-3xl font-bold tracking-tight sm:text-4xl ${priceColor}`}>
                {formatValue(current, 'current')}
              </span>
              <span className={`num text-sm font-semibold ${changeColor}`}>
                {formatValue(chg, 'chg')}
              </span>
              <span className={`num rounded-md px-2 py-0.5 text-sm font-semibold ${
                parseFloat(percent) > 0
                  ? 'bg-red-500/15 text-red-400'
                  : parseFloat(percent) < 0
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-white/5 text-slate-300'
              }`}>
                {formatValue(percent, 'percent')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:text-right">
          <div>更新时间</div>
          <div className="mt-0.5 text-slate-400">
            {now.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
            {' · '}
            {now.toLocaleDateString('zh-CN', {
              weekday: 'long'
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {entries.map(({ field, label, value }) => (
          <div
            key={field}
            className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.04]"
          >
            <span className="mb-1 block text-[11px] tracking-wide text-slate-500">
              {label}
            </span>
            <span className={`num block text-sm font-semibold ${getColorClass(field, value) || 'text-slate-200'}`}>
              {formatValue(value, field)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
