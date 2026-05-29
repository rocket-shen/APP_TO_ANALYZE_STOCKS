#  --filepath: server/tests/test_fetch_data.py
import httpx
import logging
from app.utils.xq_cookies import XueqiuCookieManager
import akshare as ak
import pandas as pd
import asyncio


logger = logging.getLogger(__name__)

async def fetch_xq_quote(symbol: str) -> dict:
    """
    获取雪球的股票报价数据
    """
    logger.info(f"开始抓取雪球的股票报价数据: {symbol}")
    
    url = "https://stock.xueqiu.com/v5/stock/quote.json"
    params = {
        "symbol": symbol.upper(),
        "extend": "detail"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            cookie_str = await XueqiuCookieManager.get_cookie(client)
            headers = {
                **XueqiuCookieManager.HEADERS,
                "Cookie": cookie_str,
                "Referer": "https://xueqiu.com/"
            }

            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json().get("data", {}).get("quote", {})
            return data

        except Exception as e:
            logger.error(f"测试抓取股票 {symbol} 报价数据失败: {str(e)}")
            raise e


async def get_stock_history_async(
    symbol: str, 
    period: str = "daily", 
    start_date: str = "20180101", 
    end_date: str = "20260525", 
    adjust: str = "qfq"
) -> pd.DataFrame:
    
    pure_symbol = "".join(filter(str.isdigit, symbol))
    if len(pure_symbol) != 6:
        raise ValueError(f"不合法的股票代码: {symbol}")

    try:
        # 2. 关键：使用 asyncio.to_thread 把阻塞的 akshare 丢给单独的线程运行，并用 await 挂起
        df = await asyncio.to_thread(
            ak.stock_zh_a_hist,
            symbol=pure_symbol,
            period=period,
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )
        print(f"df.columns: {df.columns}")  # 打印原始列名，帮助调试
        
        column_mapping = {
            "日期": "date", "开盘": "open", "收盘": "close", 
            "最高": "high", "最低": "low", "成交量": "volume",
            "成交额": "amount", "振幅": "amplitude", 
            "涨跌幅": "pct_change", "涨跌额": "chg", "换手率": "turnover_rate"
        }
        
        print(f"数据预览:\n{df.head(10)}")
        return df.rename(columns=column_mapping)

    except Exception as e:
        print(f"❌ 获取股票 {symbol} 历史数据失败: {e}")
        return pd.DataFrame()       
    

if __name__ == "__main__":
    import asyncio
    # symbol = "SH600519"  # 茅台的股票代码
    # quote_data = asyncio.run(fetch_xq_quote(symbol))
    # print(quote_data)
    symbol = "000902"
    his_data = asyncio.run(get_stock_history_async(symbol=symbol, start_date="20200101", end_date="20260525"))
    print(f"✅ 成功获取股票 {symbol} 历史数据，记录数: {len(his_data)}")