# file: server/scripts/sync_share_data.py
import asyncio
from datetime import date
from app.services.update_share_data import update_share_data
import logging
import traceback

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)

async def main():
    # 日期格式：YYYYMMDD，例如 20191231
    start_date = "20200101"
    end_date = date.today().strftime("%Y%m%d")

    while True:
        symbol = input("请输入股票代码（如 600519，输入 q 退出）: ").strip()


        # 如果没有输入内容，继续询问
        if not symbol:
            print("股票代码不能为空，请重新输入。")
            continue

        # 判断是否退出，支持 q、Q、quit、QUIT、quite、exit
        if symbol.lower() in {"q", "quit", "quite", "exit"}:
            print("👋 已退出程序。")
            break

        print(f"正在更新 {symbol}（{start_date} ~ {end_date}）...")
        try:
            await update_share_data(symbol, start_date, end_date)
            print(f"✅ {symbol} 更新完成\n")
        except Exception as e:
            print(f"❌ {symbol} 更新失败: {e}")
            traceback.print_exc()
            print()


if __name__ == "__main__":
    asyncio.run(main())