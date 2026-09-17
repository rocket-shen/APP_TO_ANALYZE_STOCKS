#   file_path: server/app/crud/update_shares_events.py

import os
import sqlite3
import akshare as ak
import numpy as np
import pandas as pd

def update_shares_events(df: pd.DataFrame, db_path: str) -> int:
    if df is None or df.empty:
        print("⚠️ 没有股本变动数据，跳过写入")
        return 0

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
 
    except sqlite3.Error as se:
        conn.rollback()
        print(f"❌ 数据库写入失败 (SQLite 错误): {se}")
    except Exception as e:
        conn.rollback()
        print(f"❌ 其它未预料的错误: {e}")
    finally:
        conn.close()

    return cursor.rowcount  # 返回受影响的行数

