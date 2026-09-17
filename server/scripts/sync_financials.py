# server/scripts/sync_financials.py
"""
命令行同步雪球三张财报（资产负债表 / 利润表 / 现金流量表）。

在 server 目录运行：
    python -m scripts.sync_financials SH600406
    python -m scripts.sync_financials SH600406 SZ000027
    python -m scripts.sync_financials --file symbols.txt
    python -m scripts.sync_financials --from-db
    python -m scripts.sync_financials --from-db --concurrency 3
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

import aiosqlite

from app.core.config import settings
from app.services.data_sync import sync_stock_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("sync_financials")


def normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


def load_symbols_from_file(path: Path) -> list[str]:
    symbols: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        symbols.append(normalize_symbol(line.split(",")[0].split()[0]))
    return symbols


async def load_symbols_from_db() -> list[str]:
    sql = """
    SELECT symbol FROM balance_sheet
    UNION
    SELECT symbol FROM cash_sheet
    UNION
    SELECT symbol FROM income_sheet
    ORDER BY symbol
    """
    async with aiosqlite.connect(str(settings.DB_PATH)) as db:
        cur = await db.execute(sql)
        rows = await cur.fetchall()
    return [row[0] for row in rows if row and row[0]]


async def sync_one(symbol: str, sem: asyncio.Semaphore, delay: float) -> tuple[str, bool, str | None]:
    async with sem:
        try:
            await sync_stock_data(symbol)
            return symbol, True, None
        except Exception as exc:
            logger.exception("同步失败: %s", symbol)
            return symbol, False, str(exc)
        finally:
            if delay > 0:
                await asyncio.sleep(delay)


async def run(symbols: list[str], concurrency: int, delay: float) -> int:
    seen: set[str] = set()
    unique: list[str] = []
    for raw in symbols:
        s = normalize_symbol(raw)
        if s and s not in seen:
            seen.add(s)
            unique.append(s)

    if not unique:
        logger.error("没有可同步的股票代码")
        return 1

    logger.info(
        "准备同步 %s 只股票，并发=%s，数据库=%s",
        len(unique),
        concurrency,
        settings.DB_PATH,
    )

    sem = asyncio.Semaphore(max(1, concurrency))
    results = await asyncio.gather(*(sync_one(s, sem, delay) for s in unique))

    ok = [s for s, success, _ in results if success]
    failed = [(s, err) for s, success, err in results if not success]
    logger.info("同步完成：成功 %s，失败 %s", len(ok), len(failed))

    if failed:
        for s, err in failed:
            logger.error("  %s -> %s", s, err)
        return 2
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="同步雪球财报到 SQLite")
    p.add_argument("symbols", nargs="*", help="带市场前缀的代码，如 SH600406")
    p.add_argument("--file", type=Path, help="代码列表文件，每行一个")
    p.add_argument("--from-db", action="store_true", help="刷新库中已有全部 symbol")
    p.add_argument("--concurrency", type=int, default=3, help="并发数，默认 3")
    p.add_argument("--delay", type=float, default=2, help="每次请求后的延迟，默认 2 秒")
    return p.parse_args(argv)


async def amain(argv: list[str]) -> int:
    args = parse_args(argv)
    symbols: list[str] = list(args.symbols)

    if args.file:
        if not args.file.exists():
            logger.error("文件不存在: %s", args.file)
            return 1
        symbols.extend(load_symbols_from_file(args.file))

    if args.from_db:
        symbols.extend(await load_symbols_from_db())

    return await run(symbols, args.concurrency, args.delay)


def main() -> None:
    raise SystemExit(asyncio.run(amain(sys.argv[1:])))


if __name__ == "__main__":
    main()


# cd server
# python -m scripts.sync_financials SH600406
# python -m scripts.sync_financials SH600406 SZ000027 --concurrency 3
# python -m scripts.sync_financials --file symbols.txt
# python -m scripts.sync_financials --file symbols.txt --concurrency 1
# python -m scripts.sync_financials --file symbols.txt --concurrency 1 --delay 2
# python -m scripts.sync_financials --from-db
