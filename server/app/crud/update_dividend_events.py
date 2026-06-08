import os
import sqlite3
import akshare as ak
import numpy as np
import pandas as pd


def update_dividend_events(
    symbol: str, db_path: str, npy_path: str
):
    """抓取指定股票的分红派息详情并更新至 SQLite 数据库（结合本地字典补全代码和名称）

    :param symbol: 股票代码，例如 '000902'
    :param db_path: SQLite 数据库文件的路径
    :param npy_path: 本地股票字典 .npy 文件的路径
    """
    print(f"========================================")
    print(f"🚀 开始处理股票: {symbol}")
    print(f"========================================")

    # 1. 核心步骤：加载本地 .npy 字典并获取股票名称
    if not os.path.exists(npy_path):
        print(f"❌ 错误: 找不到股票字典文件 {npy_path}")
        return

    try:
        # allow_pickle=True 是读取字典格式 npy 文件的关键
        stock_dict = np.load(npy_path, allow_pickle=True).item()
    except Exception as e:
        print(f"❌ 读取 .npy 字典文件失败: {e}")
        return

    # 去字典里匹配名称，如果找不到则用 "未知股票" 兜底
    stock_name = stock_dict.get(symbol, "未知股票")

    # 2. 从 akshare 抓取数据
    try:
        df = ak.stock_fhps_detail_em(symbol=symbol)
        if df is None or df.empty:
            print(f"⚠️ 未获取到股票 {symbol} 的分红数据，可能该股从未分红。")
            return
    except Exception as e:
        print(f"❌ 从 akshare 获取数据失败: {e}")
        return

    # 3. 定义除代码、名称外的标准映射字典 (中文列名 -> 数据库字段)
    column_mapping = {
        "报告期": "report_period",
        "业绩披露日期": "announcement_date",
        "除权除息日": "ex_dividend_date",
        "送转股份-送转总比例": "bonus_share_ratio",
        "现金分红-现金分红比例": "cash_dividend_ratio",
        "现金分红-股息率": "dividend_yield",
        "每股收益": "eps",
        "每股净资产": "bps",
        "每股公积金": "capital_reserve_per_share",
        "每股未分配利润": "undistributed_profit_per_share",
        "净利润同比增长": "net_profit_growth_yoy",
    }

    # 4. 动态过滤并重命名列
    available_cols = [col for col in column_mapping.keys() if col in df.columns]
    df_cleaned = df[available_cols].copy()
    df_cleaned.rename(columns=column_mapping, inplace=True)

    # 手动注入接口缺失的股票代码和股票名称
    df_cleaned["stock_code"] = symbol
    df_cleaned["stock_name"] = stock_name

    # 5. 数据清洗：统一日期格式为 'YYYY-MM-DD'
    date_cols = ["report_period", "announcement_date", "ex_dividend_date"]
    for col in date_cols:
        if col in df_cleaned.columns:
            df_cleaned[col] = (
                pd.to_datetime(df_cleaned[col], errors="coerce")
                .dt.strftime("%Y-%m-%d")
            )

    # 6. 生成原始数据的 JSON 字符串并存入 raw_json
    df_cleaned["raw_json"] = [
        row.to_json(force_ascii=False) for _, row in df.iterrows()
    ]

    # 7. 补充默认静态字段
    df_cleaned["data_source"] = "akshare"

    # 8. 写入 SQLite 数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_str = ", ".join(df_cleaned.columns)
    placeholders = ", ".join(["?"] * len(df_cleaned.columns))
    sql = f"INSERT OR REPLACE INTO dividend_events ({columns_str}) VALUES ({placeholders})"

    data_tuples = [tuple(x) for x in df_cleaned.to_numpy()]

    try:
        cursor.executemany(sql, data_tuples)
        conn.commit()
        print(
            f"✅ 成功更新/插入 [{symbol} - {stock_name}] 的 {cursor.rowcount} 条分红记录！"
        )
    except sqlite3.Error as se:
        conn.rollback()
        print(f"❌ 数据库写入失败 (SQLite 错误): {se}")
    except Exception as e:
        conn.rollback()
        print(f"❌ 其它未预料的错误: {e}")
    finally:
        conn.close()


# ========================================
# 示例调用
# ========================================
if __name__ == "__main__":
    DB_PATH = "D:/DB/financial.db"
    # 请确保该路径与你的真实 npy 文件位置一致
    FILE_PATH = "D:/DB/stock_dict_a.npy"
    symbol = "000902"  # 替换为你想测试的股票代码

    update_dividend_events(
    symbol=symbol, db_path=DB_PATH, npy_path=FILE_PATH
    )