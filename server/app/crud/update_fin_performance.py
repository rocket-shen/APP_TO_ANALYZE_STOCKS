# --filepath: server/app/crud/financial_perf.py
import aiosqlite
import akshare as ak
import pandas as pd
import asyncio
import sqlite3
import logging
from app.core.config import settings

# ==================== 日誌設定 ====================
# logging.basicConfig(
#     level=logging.INFO,                    # 設定日誌等級
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     datefmt='%Y-%m-%d %H:%M:%S'
# )

logger = logging.getLogger(__name__)

async def import_yjbb_data(date: str):
    """使用 INSERT 非同步方式匯入指定日期的業績報表資料"""
    logger.info(f"開始抓取 {date} 的業績報表...")

    try:
        # 1. 抓取資料
        df = await asyncio.to_thread(ak.stock_yjbb_em, date=date)
        logger.info(f"成功抓取到 {len(df)} 筆原始資料")
        
        # 2. 欄位對應
        column_mapping = {
            '股票代码': 'code',
            '股票简称': 'stock_name',
            '所处行业': 'industry',
            '每股收益': 'eps',
            '营业总收入-营业总收入': 'revenue',
            '营业总收入-同比增长': 'revenue_yoy',
            '营业总收入-季度环比增长': 'revenue_qoq',
            '净利润-净利润': 'net_profit',
            '净利润-同比增长': 'net_profit_yoy',
            '净利润-季度环比增长': 'net_profit_qoq',
            '每股净资产': 'nav_per_share',
            '净资产收益率': 'roe',
            '每股经营现金流量': 'ocf_per_share',
            '销售毛利率': 'gross_margin',
            '最新公告日期': 'announce_date'
        }
        
        df = df.rename(columns=column_mapping)
        
        # 3. 轉換 report_date 格式
        df['report_date'] = f"{date[:4]}-{date[4:6]}-{date[6:8]}"
        
        # 4. 轉換數值欄位
        numeric_cols = ['eps', 'revenue', 'revenue_yoy', 'revenue_qoq',
                        'net_profit', 'net_profit_yoy', 'net_profit_qoq',
                        'nav_per_share', 'roe', 'ocf_per_share', 'gross_margin']
        df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
        
        # 5. 寫入資料庫
        await async_insert_to_db(df)
        
        logger.info(f"✅ 成功匯入 {len(df)} 筆 {df['report_date'].iloc[0]} 業績報表資料！")
        
    except Exception as e:
        logger.error(f"❌ 匯入 {date} 資料時發生錯誤: {str(e)}", exc_info=True)


async def async_insert_to_db(df: pd.DataFrame):
    """改為非同步的資料庫插入函數"""
    if df.empty:
        logger.warning("傳入的 DataFrame 為空，取消資料庫操作")
        return

    # 使用 async with 自動管理連線的開啟與關閉
    async with aiosqlite.connect(str(settings.DB_PATH)) as conn:
        # 使用 async with 自動管理 cursor
        async with conn.cursor() as cursor:
            try:
                # 先刪除當期資料（注意這裡要 await）
                await cursor.execute(
                    "DELETE FROM financial_performance WHERE report_date = ?", 
                    (df['report_date'].iloc[0],)
                )
                logger.info(f"已清除 {df['report_date'].iloc[0]} 的舊資料")
                
                # INSERT 語句
                insert_sql = """
                INSERT INTO financial_performance 
                (code, report_date, stock_name, industry, eps, revenue, revenue_yoy, revenue_qoq,
                 net_profit, net_profit_yoy, net_profit_qoq, nav_per_share, roe, 
                 ocf_per_share, gross_margin, announce_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                # 準備資料
                data_tuples = [(
                    row['code'], row['report_date'], row['stock_name'], row['industry'],
                    row['eps'], row['revenue'], row['revenue_yoy'], row['revenue_qoq'],
                    row['net_profit'], row['net_profit_yoy'], row['net_profit_qoq'],
                    row['nav_per_share'], row['roe'], row['ocf_per_share'],
                    row['gross_margin'], row['announce_date']
                ) for _, row in df.iterrows()]
                
                # 批量插入（注意這裡要 await）
                await cursor.executemany(insert_sql, data_tuples)
                # 提交事務（注意這裡要 await）
                await conn.commit()
                logger.info("資料庫寫入成功")
                
            except Exception as e:
                logger.error(f"資料庫寫入失敗: {e}")
                # aiosqlite 在發生異常時通常會自動 rollback，或可手動呼叫 await conn.rollback()
                raise


# ==================== 執行 ====================
if __name__ == "__main__":
    asyncio.run(import_yjbb_data("20260331"))