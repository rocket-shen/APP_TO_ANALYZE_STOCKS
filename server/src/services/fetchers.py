import time
import httpx
import logging
from datetime import datetime
from utilis.xq_cookies import XueqiuCookieManager

logger = logging.getLogger(__name__)

async def fetch_xq_data(symbol: str, report_type: str) -> list[dict]:
    """
    通用雪球财报抓取器
    
    :param symbol: 股票代码 (需带前缀，如 SH600519)
    :param report_type: 报表类型 ('balance', 'cash_flow', 'income')
    :return: 清洗后的数据列表
    """
    
    # 1. 映射 URL
    url_map = {
        "balance": "https://stock.xueqiu.com/v5/stock/finance/cn/balance.json",
        "cash_flow": "https://stock.xueqiu.com/v5/stock/finance/cn/cash_flow.json",
        "income": "https://stock.xueqiu.com/v5/stock/finance/cn/income.json"
    }
    
    url = url_map.get(report_type)
    if not url:
        raise ValueError(f"不支持的报表类型: {report_type}")

    # 2. 准备请求参数
    params = {
        "symbol": symbol.upper(),
        "type": "all",
        "is_detail": "true",
        "count": "40",
        "timestamp": int(round(time.time() * 1000))
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            # ==================== 关键修改部分 ====================
            # 获取 cookies（现在返回的是 httpx.Cookies 对象）
            cookies: httpx.Cookies = await XueqiuCookieManager.get_cookies()

            resp = await client.get(
                url, 
                headers=XueqiuCookieManager.HEADERS,
                cookies=cookies,      # ← 直接传 cookies 对象
                params=params
            )
            resp.raise_for_status()
            
            payload = resp.json().get("data", {})
            data_list = payload.get("list", [])
            stock_name = payload.get("quote_name", "未知")

            # 5. 数据清洗与转换
            results = []
            for item in data_list:
                report_date_ts = item.get("report_date")
                if not report_date_ts:
                    continue

                # 注入额外字段供入库使用
                item["symbol"] = symbol.upper()
                item["stock_name"] = stock_name
                # 将毫秒时间戳转换为 YYYY-MM-DD
                item["report_date"] = datetime.fromtimestamp(
                    report_date_ts / 1000
                ).strftime("%Y-%m-%d")

                results.append(item)

            logger.info(f"成功抓取 {symbol} - {report_type}: {len(results)} 条记录")
            return results

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP错误 {e.response.status_code}: {symbol} - {report_type}")
            raise
        except Exception as e:
            logger.error(f"解析错误 {symbol} - {report_type}: {str(e)}")
            raise

async def fetch_xq_quote(symbol: str) -> dict:
    """
    获取雪球的股票报价数据
    """
    cookies = await XueqiuCookieManager.get_cookies()

    headers = {
        "Referer": f"https://xueqiu.com/S/{symbol}",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }

    url = (
        "https://stock.xueqiu.com/v5/stock/quote.json"
        f"?symbol={symbol}&extend=detail"
    )

    async with httpx.AsyncClient(
        headers=XueqiuCookieManager.HEADERS,
        cookies=cookies,
        timeout=15.0,
    ) as client:

        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json().get("data", {}).get("quote", {})
        return data
