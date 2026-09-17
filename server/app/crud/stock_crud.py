# -- filepath: server/app/crud/stock_crud.py
import json
import aiosqlite
import logging
from app.core.config import settings
import asyncio

logger = logging.getLogger(__name__)

_write_lock = asyncio.Lock()

async def _generic_upsert(table_name: str, records: list[dict]):
    if not records:
        logger.warning("表 %s 无记录需要更新", table_name)
        return

    sql = f"""
    INSERT INTO {table_name} (symbol, stock_name, report_date, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(symbol, report_date) DO UPDATE SET
        stock_name = excluded.stock_name,
        raw_json = excluded.raw_json
    """

    data_tuples = [
        (
            r["symbol"],
            r.get("stock_name", "未知"),
            r["report_date"],
            json.dumps(r, ensure_ascii=False),
        )
        for r in records
    ]

    async with _write_lock:
        async with aiosqlite.connect(str(settings.DB_PATH), timeout=30) as db:
            await db.execute("PRAGMA journal_mode=WAL")
            await db.execute("PRAGMA busy_timeout=30000")
            await db.executemany(sql, data_tuples)
            await db.commit()
            logger.info("成功更新表 %s: %s 条记录", table_name, len(records))


# --- 下面这三个函数必须把 db_path 传给 _generic_upsert ---

async def upsert_balance_records(records: list[dict]):
    await _generic_upsert("balance_sheet", records) # ⬅️ 传入

async def upsert_cash_records(records: list[dict]):
    await _generic_upsert("cash_sheet", records) # ⬅️ 传入 (请确认你的表名)

async def upsert_income_records(records: list[dict]):
    await _generic_upsert("income_sheet", records) # ⬅️ 传入