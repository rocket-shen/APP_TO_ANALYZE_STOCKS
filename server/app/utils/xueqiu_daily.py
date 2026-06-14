#  -- filepath: server/app/utils/xueqiu_daily.py
import datetime
import random
import httpx
import asyncio
import logging
import csv
import io
import os
import aiofiles  # 需要安装: pip install aiofiles
from typing import List, Dict, Any

# 导入你提供好的 Cookie 管理器
# 请根据你的实际路径调整导入：从 xq_a_token 模块导入 XueqiuCookieManager
from app.utils.xq_a_token import XueqiuCookieManager

logger = logging.getLogger(__name__)

XUEQIU_FIELD_MAP = {
    "symbol": "股票代码",
    "name": "股票名称",
    "current": "当前价",
    "chg": "涨跌额",
    "percent": "涨跌幅(%)",
    "current_year_percent": "今年以来涨跌幅(%)",
    "volume": "成交量",
    "amount": "成交额",
    "turnover_rate": "换手率(%)",
    "volume_ratio": "量比",
    "amplitude": "振幅(%)",
    "limitup_days": "昨日连板天数",
    "pe_ttm": "市盈率(TTM)",
    "pb_ttm": "市净率(TTM)",
    "pb": "市净率",
    "ps": "市销率",
    "pcf": "市现率",
    "roe_ttm": "净资产收益率(ROE/TTM)",
    "eps": "每股收益(EPS)",
    "net_profit_cagr": "净利润增长率(CAGR)",
    "income_cagr": "营收增长率(CAGR)",
    "dividend_yield": "股息率(%)",
    "market_capital": "总市值",
    "float_market_capital": "流通市值",
    "total_shares": "总股本",
    "float_shares": "流通股本",
    "main_net_inflows": "主力净流入",
    "north_net_inflow": "北向资金净流入",
    "north_net_inflow_time": "北向流入时间",
    "followers": "关注人数",
    "issue_date_ts": "上市日期戳",
    "first_percent": "首日涨跌幅(%)",
    "total_percent": "累计涨跌幅(%)",
    "percent5m": "5分钟涨跌幅(%)",
    "lot_size": "每手股数",
    "tick_size": "最小价格变动"
}

async def save_to_csv_async(data: List[Dict[str, Any]], filepath: str):
    if not data:
        logger.warning("没有数据需要保存。")
        return

    # 1. 引入我们定义好的字段映射表
    field_map = XUEQIU_FIELD_MAP

    # 2. 这里的表头（headers）统一使用映射表里的中文名
    # 采用固定顺序或按映射表顺序排列，这样导出的 CSV 列顺序更加可控
    headers = list(field_map.values())

    # 确保文件目录存在
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)

    try:
        # 使用 aiofiles 以异步模式打开文件，指定 utf-8-sig 防止 Excel 打开中文乱码
        async with aiofiles.open(filepath, mode='w', encoding='utf-8-sig', newline='') as f:
            
            # 写入表头
            header_str = ",".join([f'"{h}"' for h in headers]) + "\n"
            await f.write(header_str)
            
            # 3. 将 StringIO 提至循环外复用，避免几千次循环带来的内存开销
            output = io.StringIO()
            cw = csv.DictWriter(output, fieldnames=headers)
            
            # 批量或逐行处理行数据
            for item in data:
                # 4. 构建包含中文 Key 的行字典
                row_dict = {}
                for eng_key, chn_key in field_map.items():
                    val = item.get(eng_key)
                    
                    # 细节处理：如果雪球返回的是 null (Python中为 None)，转换为空字符串
                    if val is None:
                        val = ''
                        
                    row_dict[chn_key] = val
                
                # 清空缓冲区，将单行转换为标准 CSV 文本后再异步写入
                output.seek(0)
                output.truncate(0)
                
                cw.writerow(row_dict)
                row_str = output.getvalue()
                await f.write(row_str)
            
            output.close()
                
        logger.info(f"✅ 数据成功异步保存至 CSV 文件: {filepath}")
    except Exception as e:
        logger.error(f"❌ 保存 CSV 文件失败: {repr(e)}")
        raise e


async def fetch_xueqiu_daily_to_csv(output_filepath: str ,limit_count: int):
    """
    异步核心函数：使用 XueqiuCookieManager 抓取全量 A 股股票并保存为 CSV 
    """
    url = "https://stock.xueqiu.com/v5/stock/screener/quote/list.json"
    
    # 1. 实例化一个支持异步流式处理的 httpx 客户端
    async with httpx.AsyncClient(headers=XueqiuCookieManager.HEADERS, timeout=15.0) as client:
        
        # 2. 获取并注入雪球过完 WAF 后的最新 Cookies
        cookies = await XueqiuCookieManager.get_cookies()
        client.cookies = cookies
        
        all_stocks: List[Dict[str, Any]] = []
        page = 1
        size = 100  # 每页 100 条是平衡效率与风控的最佳甜点位
        
        logger.info("🚀 开始全量异步抓取雪球 A 股数据...")
        
        while True:
            params = {
                "page": page,
                "size": size,
                "order": "desc",
                "order_by": "market_capital",
                "market": "CN",
                "type": "sh_sz"
            }
            
            try:
                # 发送异步 GET 请求
                response = await client.get(url, params=params)
                
                # 如果 Cookie 过期被风控（通常返回 400/401/403），尝试刷新一次 Cookie
                if response.status_code in [401, 403]:
                    logger.warning(f"[Page {page}] 触发风控或Token过期 ({response.status_code})，正在尝试刷新 Cookie...")
                    XueqiuCookieManager.clear_cache()
                    client.cookies = await XueqiuCookieManager.get_cookies()
                    # 重新请求当前页
                    response = await client.get(url, params=params)
                    
                if response.status_code != 200:
                    logger.error(f"❌ 请求第 {page} 页失败，状态码: {response.status_code}，终止抓取。")
                    break
                
                res_json = response.json()
                stocks_list = res_json.get("data", {}).get("list", [])
                
                # 如果某一页没有返回数据，说明全量翻页已爬完
                if not stocks_list:
                    logger.info(f"🏁 已到达最后一页，共完成 {page - 1} 页的抓取。")
                    break
                
                # 将抓取到的数据加入到主列表中
                all_stocks.extend(stocks_list)
                logger.info(f"📊 成功抓取第 {page} 页，当前累计获取 {len(all_stocks)} 只股票")

                # ⭐ 动态判断：数量达到外部传入的 limit_count 时提前结束
                if len(all_stocks) >= limit_count:
                    logger.info(f"🎯 已抓取到足够数量的股票（>= {limit_count}只），停止翻页。")
                    break
                
                # 3. 页面间留出微小的非阻塞休眠，防止请求过快被阿里云防火墙拉黑
                await asyncio.sleep(random.uniform(0.5, 0.9))
                page += 1
                
            except Exception as e:
                logger.error(f"❌ 抓取第 {page} 页时发生严重异常: {repr(e)}")
                break
        
        # 4. 数据抓取完毕后，进行内存去重与清洗（防止翻页期间因实时排序变动导致的个别重复）
        if all_stocks:
            unique_stocks = {}
            for stock in all_stocks:
                symbol = stock.get("symbol")
                if symbol:
                    unique_stocks[symbol] = stock
            
            cleaned_data = list(unique_stocks.values())[:limit_count]
            logger.info(f"🧹 去重清洗完成：总数据量由 {len(all_stocks)} 净化为 {len(cleaned_data)} 只股票")
            
            # 5. 调用异步 CSV 保存函数
            await save_to_csv_async(cleaned_data, output_filepath)
            print(f"\n✨ 任务圆满完成！全量股票已落盘。共抓取 {len(cleaned_data)} 只。")
        else:
            logger.error("❌ 未抓取到任何有效的股票数据。")


# 本地调试运行入口
if __name__ == "__main__":
    # 配置日志输出格式，方便观察进度
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    date_str = datetime.datetime.now().strftime("%Y%m%d")
    filepath = f"D:/雪球数据/xueqiu_daily/{date_str}_xueqiu_daily.csv"
    
    # 执行异步主函数
    asyncio.run(fetch_xueqiu_daily_to_csv(filepath, limit_count=3000))  # 这里的 limit_count 可以根据需要调整，设置为 None 或一个大数表示不限制数量