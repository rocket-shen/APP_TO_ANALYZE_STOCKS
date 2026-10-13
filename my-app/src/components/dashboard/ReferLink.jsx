import { ExternalLink } from 'lucide-react';

const LINKS = [
  { label: '东方财富', href: (symbol) => `https://so.eastmoney.com/web/s?keyword=${symbol}` },
  { label: '巨潮资讯', href: (symbol) => `https://www.cninfo.com.cn/new/fulltextSearch?notautosubmit=&keyWord=${symbol}` },
  { label: '同花顺', href: (symbol) => `https://stockpage.10jqka.com.cn/${symbol}` },
  { label: '雪球', href: (symbol) => `https://xueqiu.com/k?q=${symbol}` },
];

const ReferLink = ({ symbol }) => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href(symbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button glass-panel flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-cyan-300 hover:border-cyan-400/50 hover:text-white"
        >
          {label}
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      ))}
    </div>
  );
};

export default ReferLink;
