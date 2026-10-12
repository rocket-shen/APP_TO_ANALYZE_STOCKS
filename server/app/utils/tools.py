# -- filepath: server/app/utils/tools.py

from app.core.config import settings
import numpy as np

_stock_dict: dict | None = None


def _load_stock_dict() -> dict:
    """第一次调用时才读 npy；之后复用内存里的副本。"""
    global _stock_dict

    stock_dict = _stock_dict
    if stock_dict is None:
        path = settings.STOCK_DICT_A_PATH
        if path.exists():
            stock_dict = np.load(path, allow_pickle=True).item()
        else:
            stock_dict = {}

        _stock_dict = stock_dict

    return stock_dict


def get_stock_name(stock_code: str) -> str | None:
    """根据股票代码返回名称，找不到返回 None"""
    return _load_stock_dict().get(stock_code)


def search_by_name(keyword: str) -> dict:
    """根据名称关键词模糊搜索，返回 {代码: 名称}"""
    return {
        code: name
        for code, name in _load_stock_dict().items()
        if keyword in name
    }


def strip_stock_prefix(stock_code):
    """
    去掉市场前缀，返回 6 位数字代码（DB 中 financial_performance.code 等字段用裸代码）。

    参数:
        stock_code (str): 6 位数字，或带 SH/SZ/BJ 前缀的代码

    返回:
        str: 裸 6 位代码，如 '600000'
    """
    code = str(stock_code).strip().upper()
    if code.startswith(("SH", "SZ", "BJ")) and len(code) > 2:
        code = code[2:]
    if not code.isdigit() or len(code) != 6:
        raise ValueError("股票代码应为6位数字，或带 SH/SZ/BJ 前缀")
    return code


def add_stock_prefix(stock_code):
    """
    根据股票代码添加市场前缀（SH 或 SZ）

    参数:
        stock_code (str): 6位数字的股票代码

    返回:
        str: 添加前缀后的完整股票代码，如 'SH600000' 或 'SZ000001'
    """
    # 确保输入为字符串并去除空格
    code = str(stock_code).strip()

    # 如果已有前缀，直接返回
    if code.upper().startswith(('SH', 'SZ')):
        return code.upper()

    # 检查是否为6位数字
    if not code.isdigit() or len(code) != 6:
        raise ValueError("股票代码应为6位数字")

    # 根据首位数字判断市场
    first_digit = code[0]
    if first_digit == '6':
        prefix = 'SH'
    elif first_digit in ('0', '2', '3'):
        prefix = 'SZ'
    else:
        raise ValueError(f"无法识别的股票代码开头：{first_digit}")

    return f"{prefix}{code}"


import json
from pathlib import Path

def load_financial_config():
    config_path = Path(settings.FINANCIAL_FIELDS_JSON)
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)

from datetime import date, datetime

_STANDARD_QUARTER_ENDS = frozenset({(3, 31), (6, 30), (9, 30), (12, 31)})


def _parse_report_date(value) -> date | None:
    """Parse report_date into a date; returns None if unusable."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    if not text:
        return None
    text = text[:10]
    try:
        return date.fromisoformat(text)
    except ValueError:
        return None


def _year_quarter(d: date) -> tuple[int, int]:
    return d.year, (d.month - 1) // 3 + 1


def dedupe_quarterly_rows(rows: list[dict], date_key: str = "report_date") -> list[dict]:
    """Keep one row per calendar year-quarter.

    Groups by year + quarter derived from ``report_date`` month.
    Prefers standard quarter-end dates (03-31 / 06-30 / 09-30 / 12-31);
    otherwise keeps the row with the latest ``report_date``.
    Preserves first-seen quarter order. Rows without a parseable date
    are kept at the end in original order.
    """
    if not rows:
        return []

    best: dict[tuple[int, int], dict] = {}
    best_date: dict[tuple[int, int], date] = {}
    best_is_standard: dict[tuple[int, int], bool] = {}
    order: list[tuple[int, int]] = []
    undated: list[dict] = []

    for row in rows:
        d = _parse_report_date(row.get(date_key) if isinstance(row, dict) else None)
        if d is None:
            undated.append(row)
            continue

        key = _year_quarter(d)
        is_standard = (d.month, d.day) in _STANDARD_QUARTER_ENDS

        if key not in best:
            best[key] = row
            best_date[key] = d
            best_is_standard[key] = is_standard
            order.append(key)
            continue

        prev_standard = best_is_standard[key]
        prev_d = best_date[key]
        replace = False
        if is_standard and not prev_standard:
            replace = True
        elif is_standard == prev_standard and d > prev_d:
            replace = True

        if replace:
            best[key] = row
            best_date[key] = d
            best_is_standard[key] = is_standard

    return [best[k] for k in order] + undated
