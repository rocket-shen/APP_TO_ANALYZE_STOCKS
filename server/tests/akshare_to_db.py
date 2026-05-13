import pandas as pd
import akshare as ak
import sqlite3
from pathlib import Path


def update_financial_performance(date, db_path):
    conn = sqlite3.connect(db_path)

    print(f"拉取业绩报表: {date}")

    # 1. 获取数据
    df = ak.stock_yjbb_em(date=date)

    if df is None or df.empty:
        print("无数据")
        return

    # 2. 清洗列名（关键）
    df.columns = df.columns.str.replace(r"\s+|\n|\r", "", regex=True)

    # 3. 重命名字段
    df = df.rename(columns={
        "股票代码": "code",
        "股票简称": "stock_name",
        "每股收益": "eps",
        "营业总收入-营业总收入": "revenue",
        "营业总收入-同比增长": "revenue_yoy",
        "营业总收入-季度环比增长": "revenue_qoq",
        "净利润-净利润": "net_profit",
        "净利润-同比增长": "net_profit_yoy",
        "净利润-季度环比增长": "net_profit_qoq",
        "每股净资产": "nav_per_share",
        "净资产收益率": "roe",
        "每股经营现金流量": "ocf_per_share",
        "销售毛利率": "gross_margin",
        "所处行业": "industry",
        "最新公告日期": "announce_date"
    })

    # 4. 标准化字段
    df["code"] = df["code"].astype(str).str.zfill(6)

    report_date = pd.to_datetime(date).strftime("%Y-%m-%d")
    df["report_date"] = report_date

    # 5. 只保留字段
    df = df[
        [
            "code", "report_date",
            "stock_name", "industry",
            "eps",
            "revenue", "revenue_yoy", "revenue_qoq",
            "net_profit", "net_profit_yoy", "net_profit_qoq",
            "nav_per_share", "roe",
            "ocf_per_share", "gross_margin",
            "announce_date"
        ]
    ]

    # 6. 删除已有数据（实现“更新”）
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM financial_performance WHERE report_date = ?",
        (report_date,)
    )
    conn.commit()

    # 7. 写入数据库
    df.to_sql(
        "financial_performance",
        conn,
        if_exists="append",
        index=False
    )

    print(f"写入完成: {len(df)} 条")

    conn.close()

if __name__ == "__main__":
    try:
        # 正常 python server/main.py 或 uvicorn server.main:app 時
        BASE_DIR = Path(__file__).resolve().parent.parent
    except NameError:
        # 在某些 IDE / jupyter / pytest 等環境下 __file__ 可能不存在
        BASE_DIR = Path.cwd().resolve()

    DB_PATH = BASE_DIR  / "data" / "financial.db"
    # 示例：更新2025年第三季度的业绩报表数据
    update_financial_performance("20251231", DB_PATH)