# --filepath: server/tests/test_akshare.py
import akshare as ak  # type: ignore[import]
import pandas as pd
from typing import Union, List, Dict, Any
import json

def get_stock_history(
    symbol: str, 
    start_date: str = "20200101", 
    end_date: str = "20260525", 
    period: str = "daily", 
    adjust: str = ""
) -> pd.DataFrame:
    """
    封装 AkShare 获取 A 股股票历史交易数据的函数
    
    :param symbol: 股票代码，支持纯数字(如 '600028') 或 带前缀(如 'sh600028', 'SZ000002')
    :param start_date: 开始日期，格式 'YYYYMMDD'
    :param end_date: 结束日期，格式 'YYYYMMDD'
    :param period: 周期, 可选: 'daily' (日线), 'weekly' (周线), 'monthly' (月线)
    :param adjust: 复权类型, 可选: 'qfq' (前复权), 'hfq' (后复权), '' (不复权)
    :return: 包含历史交易数据的 Pandas DataFrame
    """
    # 1. 清理数据：AkShare 的 stock_zh_a_hist 接口只需要 6 位纯数字代码
    # 如果传入了 'sh600028' 或 'SH600028'，提纯出 '600028'
    pure_symbol = "".join(filter(str.isdigit, symbol))
    
    if len(pure_symbol) != 6:
        raise ValueError(f"不合法的股票代码: {symbol}，必须包含 6 位数字")

    try:
        # 2. 调用 AkShare 接口
        df = ak.stock_zh_a_hist(
            symbol=pure_symbol,
            period=period,
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )
        
        # 3. 规范化返回的 DataFrame 列名（可选，方便后续代码规范调用）
        # AkShare 默认返回中文列名，建议映射为英文或者保持中文
        column_mapping = {
            "日期": "date",
            "开盘": "open",
            "收盘": "close",
            "最高": "high",
            "最低": "low",
            "成交量": "volume",
            "成交额": "amount",
            "振幅": "amplitude",
            "涨跌幅": "pct_change",
            "涨跌额": "chg",
            "换手率": "turnover_rate"
        }
        df = df.rename(columns=column_mapping)
        
        return df

    except Exception as e:
        print(f"❌ 获取股票 {symbol} 历史数据失败: {e}")
        return pd.DataFrame() # 失败时返回空 DataFrame，防止调用方崩溃


def save_to_json(data: Union[pd.DataFrame, List[Dict[str, Any]], str], filepath: str) -> bool:
    """
    将股票数据保存为本地 JSON 文件
    
    :param data: 可以是 Pandas DataFrame、字典列表或 JSON 字符串
    :param filepath: 保存的 JSON 文件路径，如 'stock_data.json'
    :return: 是否保存成功
    """
    if data is None or (isinstance(data, pd.DataFrame) and data.empty):
        print("⚠️ 传入的数据为空，取消保存文件。")
        return False

    try:
        # 情况 1: 如果传入的是 DataFrame
        if isinstance(data, pd.DataFrame):
            data.to_json(filepath, orient="records", date_format="iso", force_ascii=False, indent=4)
        
        # 情况 2: 如果传入的是字典/列表
        elif isinstance(data, (dict, list)):
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
                
        # 情况 3: 如果传入的是 JSON 字符串
        elif isinstance(data, str):
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(data)
                
        else:
            raise TypeError(f"不支持的数据格式: {type(data)}")

        print(f"✅ 成功将数据保存至 JSON 文件: {filepath}")
        return True

    except Exception as e:
        print(f"❌ 保存 JSON 文件失败: {e}")
        return False

# ----------------------------------------------------
# 🧪 测试运行
# ----------------------------------------------------
if __name__ == "__main__":
    # 测试获取中国石化(600028)的前复权历史日线数据
    print("正在获取数据...")
    stock_df = get_stock_history(
        symbol="600406", 
        start_date="20141231", 
        end_date="20260601",
        adjust="qfq"
    )
    
    if not stock_df.empty:
        print("\n✅ 成功获取数据预览:")
        print(stock_df.head()) # 打印前 5 行
        print(f"\n总共获取到 {len(stock_df)} 条交易记录。")
    else:
        print("❌ 未获取到数据")