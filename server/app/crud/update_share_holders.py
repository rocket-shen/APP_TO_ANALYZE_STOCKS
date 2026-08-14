#   file_path: server/app/crud/update_share_holders.py

import aiosqlite
from datetime import datetime
from app.core.config import settings
from app.services.fetchers import fetch_xq_holders

# 表字段列表（与建表顺序对应，方便批量插入）
SHARE_HOLDERS_COLUMNS = [
    "symbol",
    "change_date",
    "stock_name",
    "ashare_holder",
    "bshare_holder",
    "chg",
    "holder_num",
    "hshare_holder",
    "per_amount",
    "per_float",
    "per_float_chg",
    "price",
    "timestamp",
    "top_float_holder_ratio",
    "top_holder_ratio",
]

async def update_share_holders(results: list[dict], db_path: str = str(settings.DB_PATH)):
    """
    将抓取结果写入 share_holders 表（主键冲突时覆盖）
    """
    if not results:
        return 0

    rows = []
    for item in results:
        row = (
            item.get("symbol"),
            item.get("change_date"),
            item.get("stock_name"),
            item.get("ashare_holder"),
            item.get("bshare_holder"),
            item.get("chg"),
            item.get("holder_num"),
            item.get("hshare_holder"),
            item.get("per_amount"),
            item.get("per_float"),
            item.get("per_float_chg"),
            item.get("price"),
            str(item.get("timestamp")),
            item.get("top_float_holder_ratio"),
            item.get("top_holder_ratio"),
        )
        rows.append(row)

    columns_str = ', '.join(SHARE_HOLDERS_COLUMNS)
    placeholders_str = ', '.join(['?'] * len(SHARE_HOLDERS_COLUMNS))
    sql = f"""
        INSERT OR REPLACE INTO share_holders (
            {columns_str}
        ) VALUES (
            {placeholders_str}
        )
        """
    async with aiosqlite.connect(db_path) as db:
        await db.executemany(sql,rows,)
        await db.commit()

    return len(rows)


if __name__ == "__main__":
    import asyncio

    async def main():
        while True:
            symbol = input("请输入股票代码（如 SH600519，输入 q 退出）: ").strip()

            if not symbol:
                continue

            if symbol.lower() in {"q", "quit", "exit"}:
                print("👋 已退出程序。")
                break

            try:
                results = await fetch_xq_holders(symbol)
                count = await update_share_holders(results)
                print(f"✅ 成功更新/插入 [{symbol}] 的 {count} 条股东信息记录！")
            except Exception as e:
                print(f"❌ 处理 [{symbol}] 失败：{e}")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 已退出程序。")