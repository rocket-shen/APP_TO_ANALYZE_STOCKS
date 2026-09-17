# -- filepath: server/app/services/data_sync.py
import asyncio
import logging
from app.services.fetchers import fetch_xq_data # 假设你的抓取函数在此
from app.crud.stock_crud import upsert_balance_records, upsert_cash_records, upsert_income_records
from app.core.config import settings

logger = logging.getLogger(__name__)

async def sync_stock_data(symbol: str):
    logger.info("开始同步股票数据: %s", symbol)
    try:
        balance_data, cash_data, income_data = await asyncio.gather(
            fetch_xq_data(symbol, "balance"),
            fetch_xq_data(symbol, "cash_flow"),
            fetch_xq_data(symbol, "income"),
        )
        await upsert_balance_records(balance_data)
        await upsert_cash_records(cash_data)
        await upsert_income_records(income_data)
        logger.info("股票 %s 同步成功：入库 %s 条报表记录", symbol, len(balance_data))
        return True
    except Exception:
        logger.exception("同步股票 %s 失败", symbol)
        raise