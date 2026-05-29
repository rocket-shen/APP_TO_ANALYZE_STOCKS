# -- filepath: server/app/crud/stock_crud.py
import json
import aiosqlite
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def _generic_upsert(table_name: str, records: list[dict]):
    
    """通用 UPSERT 邏輯（移除 db_path 參數，改用 settings）"""
    if not records:
        logger.warning(f"表 {table_name} 无记录需要更新")
        return

    # 核心 SQL：根据 (symbol, report_date) 唯一索引进行覆盖更新
    sql = f"""
    INSERT INTO {table_name} (symbol, stock_name, report_date, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(symbol, report_date) DO UPDATE SET
        stock_name = excluded.stock_name,
        raw_json = excluded.raw_json
    """

    try:
        async with aiosqlite.connect(str(settings.DB_PATH)) as db:
            data_tuples = [
                (
                    r["symbol"],
                    r.get("stock_name", "未知"), # 处理 NOT NULL 约束
                    r["report_date"],
                    json.dumps(r, ensure_ascii=False)
                )
                for r in records
            ]
            await db.executemany(sql, data_tuples)
            await db.commit()
            logger.info(f"成功更新表 {table_name}: {len(records)} 条记录")
            
    except Exception as e:
        logger.error(f"写入表 {table_name} 时发生错误: {str(e)}")
        raise

# --- 下面这三个函数必须把 db_path 传给 _generic_upsert ---

async def upsert_balance_records(records: list[dict]):
    await _generic_upsert("balance_sheet", records) # ⬅️ 传入

async def upsert_cash_records(records: list[dict]):
    await _generic_upsert("cash_sheet", records) # ⬅️ 传入 (请确认你的表名)

async def upsert_income_records(records: list[dict]):
    await _generic_upsert("income_sheet", records) # ⬅️ 传入