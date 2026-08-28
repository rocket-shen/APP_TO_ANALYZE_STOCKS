import time
import random
import json
import akshare as ak  # type: ignore[import]
import pandas as pd
from typing import Literal, Union, List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from app.core.config import settings


def get_stock_history(
    symbol: str, 
    start_date: str = "20200101", 
    end_date: str = "20260816", 
    period: str = "daily", 
    adjust: str = "",
    max_retries: int = 3
) -> pd.DataFrame:
    """
    封装 AkShare 获取 A 股股票历史交易数据的函数（含指数退避重试机制）
    
    :param symbol: 股票代码，支持纯数字(如 '600028') 或 带前缀(如 'sh600028', 'SZ000002')
    :param start_date: 开始日期，格式 'YYYYMMDD'
    :param end_date: 结束日期，格式 'YYYYMMDD'
    :param period: 周期, 可选: 'daily' (日线), 'weekly' (周线), 'monthly' (月线)
    :param adjust: 复权类型, 可选: 'qfq' (前复权), 'hfq' (后复权), '' (不复权)
    :param max_retries: 最大重试次数
    :return: 包含历史交易数据的 Pandas DataFrame
    """
    # 1. 清理数据：AkShare 的 stock_zh_a_hist 接口只需要 6 位纯数字代码
    pure_symbol = "".join(filter(str.isdigit, symbol))
    
    if len(pure_symbol) != 6:
        raise ValueError(f"不合法的股票代码: {symbol}，必须包含 6 位数字")

    # 2. 带有重试机制的接口调用
    for attempt in range(1, max_retries + 1):
        try:
            # 每次请求前随机等待 0.8~1.8 秒，平缓请求频率，防止被服务器封杀
            time.sleep(random.uniform(0.8, 1.8))

            df = ak.stock_zh_a_hist(
                symbol=pure_symbol,
                period=period,
                start_date=start_date,
                end_date=end_date,
                adjust=adjust
            )
            
            if df.empty:
                print(f"⚠️ 接口返回无数据，股票代码可能不存在或指定范围内无交易: {symbol}")
                return pd.DataFrame()

            # 3. 规范化返回的 DataFrame 列名
            column_mapping = {
                "日期": "date",
                "股票代码": "stock_code",
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
            print(f"⚠️ 第 {attempt}/{max_retries} 次获取股票 {symbol} 数据失败: {e}")
            if attempt < max_retries:
                # 失败后进行退避等待（如第 1 次失败等 2 秒，第 2 次等 4 秒）
                wait_time = attempt * 2
                print(f"⏳ 正在尝试重新连接，等待 {wait_time} 秒...")
                time.sleep(wait_time)
            else:
                print(f"❌ 获取股票 {symbol} 历史数据彻底失败。")
                return pd.DataFrame()

    return pd.DataFrame()


def save_to_json(
    data: pd.DataFrame,
    output_dir: Union[str, Path] = settings.OUTPUT_JSON_DIR,
    prefix: str = "stock"
) -> Optional[str]:
    """
    将 DataFrame 保存为 JSON 文件
    
    :param data: Pandas DataFrame
    :param output_dir: 输出目录
    :param prefix: 文件名前缀
    :return: 保存的文件路径，失败返回 None
    """
    if data is None or data.empty:
        print("⚠️ 传入的数据为空，取消保存文件。")
        return None

    try:
        # 创建输出目录
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 生成文件名：前缀_时间戳.json
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.json"
        filepath = output_path / filename
        
        # 将 DataFrame 转换为字典列表
        records = data.to_dict('records')
        print(records)
        
        # 处理每个记录中的日期字段
        for record in records:
            for key, value in record.items():
                if isinstance(value, (pd.Timestamp, datetime)):
                    record[key] = value.strftime('%Y-%m-%d')
                elif isinstance(value, str) and key == 'date':
                    if value.isdigit() and len(value) == 13:
                        try:
                            record[key] = pd.to_datetime(int(value), unit='ms').strftime('%Y-%m-%d')
                        except Exception:
                            pass
        
        # 转换为 JSON 并保存
        json_str = json.dumps(records, ensure_ascii=False, indent=2)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(json_str)
        
        print(f"✅ 数据已保存: {filepath}")
        return str(filepath)
        
    except Exception as e:
        print(f"❌ 保存 JSON 文件失败: {e}")
        return None


# ----------------------------------------------------
# 🧪 测试运行
# ----------------------------------------------------
if __name__ == "__main__":
    OUTPUT_JSON_DIR = settings.OUTPUT_JSON_DIR

    while True:
        symbol = input("\n请输入股票代码（如 600519，输入 q 退出）: ").strip()

        # 如果没有输入内容，继续询问
        if not symbol:
            print("股票代码不能为空，请重新输入。")
            continue

        # 判断是否退出，支持 q、Q、quit、QUIT、quite、exit
        if symbol.lower() in {"q", "quit", "quite", "exit"}:
            print("👋 已退出程序。")
            break

        # 清理提取出 pure_symbol 用于传给 prefix 命名
        pure_symbol = "".join(filter(str.isdigit, symbol))
        if len(pure_symbol) != 6:
            print(f"⚠️ 输入的股票代码格式有误 ({symbol})，必须包含 6 位数字。")
            continue

        # 获取历史数据
        df = get_stock_history(
            symbol=pure_symbol, 
            start_date="20200101", 
            end_date="20260701", 
            adjust=""
        )
        
        # 保存数据
        if not df.empty:
            file_path = save_to_json(df, output_dir=OUTPUT_JSON_DIR, prefix=pure_symbol)