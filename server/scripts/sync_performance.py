# server/scripts/sync_performance.py
"""命令行同步东方财富业绩快报到 financial_performance。"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from app.crud.update_fin_performance import import_yjbb_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("sync_performance")


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="同步业绩快报（按报告期）")
    p.add_argument(
        "dates",
        nargs="+",
        help="报告期 YYYYMMDD，可多个，如 20251231 20260630",
    )
    return p.parse_args(argv)


async def run(dates: list[str]) -> int:
    failed = []
    for date in dates:
        date = date.strip()
        if len(date) != 8 or not date.isdigit():
            logger.error("日期格式错误（需要 YYYYMMDD）: %s", date)
            failed.append(date)
            continue
        logger.info("开始导入业绩快报: %s", date)
        try:
            await import_yjbb_data(date)
        except Exception:
            logger.exception("导入失败: %s", date)
            failed.append(date)

    if failed:
        logger.error("失败: %s", ", ".join(failed))
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    return asyncio.run(run(args.dates))


if __name__ == "__main__":
    raise SystemExit(main())

# 用法：
# cd server
# python -m scripts.sync_performance 20260630
# python -m scripts.sync_performance 20241231 20250630 20260630