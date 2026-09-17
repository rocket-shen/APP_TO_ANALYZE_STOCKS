# server/scripts/sync_dividends.py
"""命令行同步分红除权数据。"""

from __future__ import annotations

import argparse
import logging
import sys

from app.core.config import settings
from app.crud.update_dividend_events import update_dividend_events

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("sync_dividends")


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="同步分红派息到 SQLite")
    p.add_argument(
        "symbols",
        nargs="+",
        help="6 位股票代码，可一次多个，如 000902 600519",
    )
    p.add_argument(
        "--db",
        default=str(settings.DB_PATH),
        help="SQLite 路径，默认 settings.DB_PATH",
    )
    p.add_argument(
        "--npy",
        default=str(settings.STOCK_DICT_A_PATH),
        help="股票名称字典 .npy 路径",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    logger.info("数据库: %s", args.db)
    logger.info("名称字典: %s", args.npy)

    failed = []
    for raw in args.symbols:
        symbol = raw.strip()[-6:]  # 兼容 SZ000902
        if not symbol:
            continue
        logger.info("开始同步分红: %s", symbol)
        try:
            update_dividend_events(
                symbol=symbol,
                db_path=args.db,
                npy_path=args.npy,
            )
        except Exception:
            logger.exception("同步失败: %s", symbol)
            failed.append(symbol)

    if failed:
        logger.error("失败: %s", ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


# 用法：
# cd server
# python -m scripts.sync_dividends 000902
# python -m scripts.sync_dividends 000902 600519 000001
# python -m scripts.sync_dividends 000902 --db D:/DB/financial.db