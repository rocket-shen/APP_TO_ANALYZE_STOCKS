#  -- filepath: server/app/utils/xueqiu_daily.py
import httpx
import asyncio
import logging
import csv
import os
import aiofiles  # 需要安装: pip install aiofiles
from typing import List, Dict, Any

# 导入你提供好的 Cookie 管理器
# 请根据你的实际路径调整导入：从 xq_a_token 模块导入 XueqiuCookieManager
from app.utils.xq_a_token import XueqiuCookieManager

logger = logging.getLogger(__name__)

async def save_to_csv_async(data: List[Dict[str, Any]], filepath: str):
    """
    异步将列表字典数据保存为 CSV 文件。
    使用 aiofiles 配合标准库 csv 模块，防止大文件 I/O 阻塞事件循环。
    """
    if not data:
        logger.warning("没有数据需要保存。")
        return

    # 提取 CSV 的表头（所有字典的 key 并集）
    headers = set()
    for item in data:
        headers.update(item.keys())
    headers = sorted(list(headers))

    # 确保目录存在
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)

    try:
        # 使用 aiofiles 以异步模式打开文件，指定 utf-8-sig 防止 Excel 打开中文乱码
        async with aiofiles.open(filepath, mode='w', encoding='utf-8-sig', newline='') as f:
            # 建立一个异步写入代理
            writer = csv.DictWriter(f, fieldnames=headers)
            
            # 由于 DictWriter 内部是同步的，我们可以通过将其转换为字符串或按行写入
            # 对于几千条的小数据量，也可以直接在 aiofiles 的上下文中利用同步思维配合 await 写入
            # 这里采用最安全和高兼容性的写入方式：
            
            # 写入表头
            header_str = ",".join([f'"{h}"' for h in headers]) + "\n"
            await f.write(header_str)
            
            # 批量或逐行处理行数据
            for item in data:
                # 保证所有 field 都在字典里，缺少的填空字符串
                row_dict = {h: item.get(h, '') for h in headers}
                
                # 利用内存缓冲转换为单行标准 CSV 文本后再异步写入
                import io
                output = io.StringIO()
                cw = csv.DictWriter(output, fieldnames=headers)
                cw.writerow(row_dict)
                row_str = output.getvalue()
                output.close()
                
                await f.write(row_str)
                
        logger.info(f"✅ 数据成功异步保存至 CSV 文件: {filepath}")
    except Exception as e:
        logger.error(f"❌ 保存 CSV 文件失败: {repr(e)}")
        raise e


async def fetch_all_xueqiu_stocks_to_csv(output_filepath: str = "data/xueqiu_stocks.csv"):
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
                "order_by": "percent",
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
                
                # 3. 页面间留出微小的非阻塞休眠，防止请求过快被阿里云防火墙拉黑
                await asyncio.sleep(0.6)
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
            
            cleaned_data = list(unique_stocks.values())
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
    filepath = "D:/雪球数据/xueqiu_daily/20260608.csv"
    
    # 执行异步主函数
    asyncio.run(fetch_all_xueqiu_stocks_to_csv(filepath))