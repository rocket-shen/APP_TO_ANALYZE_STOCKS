
const ReferLink = ({ symbol }) => {
    return (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <a
          href={`https://so.eastmoney.com/web/s?keyword=${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
        >
          东方财富
        </a>
        <a
          href={`https://www.cninfo.com.cn/new/fulltextSearch?notautosubmit=&keyWord=${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
        >
          巨潮资讯
        </a>
        <a
          href={`https://stockpage.10jqka.com.cn/${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
        >
          同花顺
        </a>
        <a
          href={`https://xueqiu.com/k?q=${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white rounded-xl transition-all duration-200"
        >
          雪球
        </a>
      </div>
    );
};

export default ReferLink;