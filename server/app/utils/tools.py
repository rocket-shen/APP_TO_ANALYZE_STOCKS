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