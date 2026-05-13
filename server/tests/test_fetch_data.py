import httpx
import logging
from utilis.xq_cookies import XueqiuCookieManager

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
        
if __name__ == "__main__":
    import asyncio
    symbol = "SH600519"  # 茅台的股票代码
    quote_data = asyncio.run(fetch_xq_quote(symbol))
    print(quote_data)