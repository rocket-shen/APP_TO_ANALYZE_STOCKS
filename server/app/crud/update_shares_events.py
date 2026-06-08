import os
import sqlite3
import akshare as ak
import numpy as np
import pandas as pd

def update_shares_events(
    symbol: str, start_date: str, end_date: str, db_path: str
):
    print(f":param {symbol}: 股票代码")
    print(f":param {start_date}: 开始日期")
    print(f":param {end_date}: 结束日期")
    print(f":param {db_path}: SQLite 数据库文件的路径")
    print(f"========================================")
    print(f"🚀 开始处理股票: {symbol}")
    print(f"========================================")

    try:
        df = ak.stock_share_change_cninfo(symbol=symbol, start_date=start_date, end_date=end_date)
        if df is None or df.empty:
            print(f"⚠️ 未获取到股票 {symbol} 的股本变动数据。")
            return
    except Exception as e:
        print(f"❌ 从 akshare 获取数据失败: {e}")
        return

    capital_share_mapping = {
        # 基础信息
        "证券代码": "stock_code",
        "证券简称": "stock_name",
        "机构名称": "institution_name",
        "公告日期": "announcement_date",
        "变动日期": "change_date",
        "变动原因": "change_reason",
        
        # 总量指标
        "总股本": "total_shares",
        "已流通股份": "tradable_shares",
        "未流通股份": "non_tradable_shares",
        "流通受限股份": "restricted_shares",
        "优先股": "preferred_shares"
    }
    available_cols = [col for col in capital_share_mapping.keys() if col in df.columns]
    df_cleaned = df[available_cols].copy()
    df_cleaned.rename(columns=capital_share_mapping, inplace=True)

    date_cols = ["announcement_date", "change_date"]
    for col in date_cols:
        if col in df_cleaned.columns:
            df_cleaned[col] = (
                pd.to_datetime(df_cleaned[col], errors="coerce")
                .dt.strftime("%Y-%m-%d")
            )
    
    df_cleaned["raw_json"] = [
        row.to_json(force_ascii=False) for _, row in df.iterrows()
    ]

    #  补充默认静态字段
    df_cleaned["data_source"] = "akshare"

    #  写入 SQLite 数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_str = ", ".join(df_cleaned.columns)
    placeholders = ", ".join(["?"] * len(df_cleaned.columns))
    sql = f"INSERT OR REPLACE INTO shares_events ({columns_str}) VALUES ({placeholders})"

    data_tuples = [tuple(x) for x in df_cleaned.to_numpy()]

    try:
        cursor.executemany(sql, data_tuples)
        conn.commit()
        print(
            f"✅ 成功更新/插入 [{symbol}] 的 {cursor.rowcount} 条股本变动记录！"
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
    symbol = "002170"  # 替换为你想测试的股票代码
    start_date = "20111231"
    end_date = "20260601"

    update_shares_events(symbol=symbol, start_date=start_date, end_date=end_date, db_path=DB_PATH)