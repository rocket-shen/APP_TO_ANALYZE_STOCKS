

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
    base_path = Path(__file__).resolve().parent.parent
    config_path = base_path / "config" / "financial_fields.json"

    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)