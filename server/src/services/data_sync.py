import asyncio
import logging
from src.services.fetchers import fetch_xq_data # 假设你的抓取函数在此
from src.services.db_crud import upsert_balance_records, upsert_cash_records, upsert_income_records

logger = logging.getLogger(__name__)

async def sync_stock_data(symbol: str, db_path: str):
    """
    协调者：并发抓取三张财报表并入库
    """
    logger.info(f"开始同步股票数据: {symbol}")
    
    try:
        # 1. 并发抓取 (雪球 API 对频率有一定限制，gather 是最高效的)
        # 确保 symbol 格式正确（雪球通常需要 SH600519 或 SZ000001）
        formatted_symbol = symbol.upper()
        if not (formatted_symbol.startswith("SH") or formatted_symbol.startswith("SZ")):
            # 简单的自动补全逻辑（可根据需求优化）
            formatted_symbol = f"SH{symbol}" if symbol.startswith("6") else f"SZ{symbol}"

        tasks = [
                fetch_xq_data(symbol, "balance"),
                fetch_xq_data(symbol, "cash_flow"),
                fetch_xq_data(symbol, "income")
            ]
        
        # 执行抓取
        balance_data, cash_data, income_data = await asyncio.gather(*tasks)

        # 2. 顺序入库 (避免 SQLite 锁竞争)
        await upsert_balance_records(balance_data, db_path)
        await upsert_cash_records(cash_data, db_path)
        await upsert_income_records(income_data, db_path)

        logger.info(f"股票 {symbol} 同步成功：入库 {len(balance_data)} 条报表记录")
        return True

    except Exception as e:
        logger.error(f"同步股票 {symbol} 失败: {str(e)}")
        raise e