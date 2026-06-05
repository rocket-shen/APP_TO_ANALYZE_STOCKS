# --filepath: server/tests/test.py
import akshare as ak

import os

# 无论是大写还是小写，全部强制清空
os.environ["http_proxy"] = ""
os.environ["https_proxy"] = ""
os.environ["HTTP_PROXY"] = ""
os.environ["HTTPS_PROXY"] = ""
os.environ["all_proxy"] = ""
os.environ["ALL_PROXY"] = ""

def get_yjbb_em(date):
    df = ak.stock_yjbb_em(date=date)

    print(df.columns)
    print(df.head())
    return df

def get_fhpx_em(code :str):
    df = ak.stock_fhps_detail_em(symbol = code)

    print(df.columns)
    print(df.head())
    return df

def get_hist_qoute(code: str, start_date: str):
    df = ak.stock_zh_a_hist(
        symbol=code,
        period="daily",
        start_date=start_date,
        end_date="20260601",
        adjust=""
    )

    print(df.columns)
    print(df.head())
    return df

if __name__ == "__main__":
    get_hist_qoute("600210", "20200101")

# CREATE TABLE financial_performance (
#     code TEXT,
#     report_date TEXT,

#     stock_name TEXT,
#     industry TEXT,

#     eps REAL,
#     revenue REAL,
#     revenue_yoy REAL,
#     revenue_qoq REAL,

#     net_profit REAL,
#     net_profit_yoy REAL,
#     net_profit_qoq REAL,

#     nav_per_share REAL,
#     roe REAL,
#     ocf_per_share REAL,
#     gross_margin REAL,

#     announce_date TEXT,

#     PRIMARY KEY (code, report_date)
# )