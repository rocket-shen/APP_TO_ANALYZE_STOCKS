import pandas as pd
import akshare as ak
import sqlite3
import datetime
import os

# ================= 新增以下代码 =================
# 强制清除代理环境变量，防止 requests 走代理导致 akshare 连接失败
# for key in ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"]:
#     os.environ.pop(key, None)
# ================================================

def get_daily_quote(code: str , start_date: str) -> pd.DataFrame:

    df = ak.stock_zh_a_hist(
        symbol=code,
        period="daily",
        start_date=start_date,
        end_date="20260601",
        adjust=""
    )

    df = df.rename(columns={
        "日期": "trade_date",
        "收盘": "close"
    })

    df["code"] = code

    df = df[[
        "code",
        "trade_date",
        "close"
    ]]

    df["trade_date"] = pd.to_datetime(df["trade_date"]).astype("datetime64[ns]")

    return df


def get_capital_change(conn, code): # 获取股本变动数据

    sql = """
    SELECT
        code,
        change_date,
        total_shares
    FROM capital_change
    WHERE code = ?
    ORDER BY change_date
    """

    df = pd.read_sql_query(
        sql,
        conn,
        params=[code]
    )

    df["change_date"] = pd.to_datetime(df["change_date"]).astype("datetime64[ns]")

    return df

def get_annual_profit(conn, code): # 获取年度利润数据（仅限年报）

    sql = """
    SELECT
        code,
        report_date,
        announcement_date,
        net_profit
    FROM profit_with_announcement
    WHERE code = ?
      AND announcement_date >= '2016-12-31'
    ORDER BY announcement_date
    """

    df = pd.read_sql_query(
        sql,
        conn,
        params=[code]
    )

    df["announce_date"] = pd.to_datetime(df["announcement_date"]).astype("datetime64[ns]")

    return df

def merge_shares(quote_df, capital_df): # 将行情数据与股本变动数据对齐，得到每个交易日对应的总股本

    return pd.merge_asof(
        quote_df.sort_values("trade_date"),
        capital_df.sort_values("change_date"),

        left_on="trade_date",
        right_on="change_date",

        by="code",

        direction="backward"
    )


def merge_profit(df, profit_df): # 将行情数据与利润公告数据对齐，得到每个交易日对应的最新利润公告

    return pd.merge_asof(
        df.sort_values("trade_date"),
        profit_df.sort_values("announce_date"),

        left_on="trade_date",
        right_on="announce_date",

        by="code",

        direction="backward"
    )


def calculate_valuation(df):    # 计算市值和PE

    df["market_cap"] = (
        df["close"] *
        df["total_shares"]
    )

    df["pe"] = (
        df["market_cap"] /
        df["net_profit"]
    )

    return df

def build_valuation_dataframe(code, conn):

    profit_df = get_annual_profit(conn, code)
    start_date = profit_df["announce_date"].min().strftime("%Y%m%d")


    quote_df = get_daily_quote(code, start_date)

    capital_df = get_capital_change(conn, code)

    
    df = merge_shares(
        quote_df,
        capital_df
    )

    df = merge_profit(
        df,
        profit_df
    )

    df = calculate_valuation(df)

    conn.close()

    return df

if __name__ == "__main__":
    DB_PATH = "D:/DB/financial.db"
    conn = sqlite3.connect(DB_PATH)
    code = "000902"
    df_valuation = build_valuation_dataframe(code, conn)
    print(df_valuation.head())

    

