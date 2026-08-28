import asyncio

from app.core.config import settings
from app.crud.update_share_holders import update_share_holders
from app.crud.update_shares_events import update_shares_events
from app.services.fetchers import fetch_xq_holders
from app.utils.tools import add_stock_prefix
from datetime import date


async def update_holder_data(symbol: str) -> None:
    """
    更新指定股票的股东数据。
    """

    prefix_symbol = add_stock_prefix(symbol)

    results = await fetch_xq_holders(prefix_symbol)

    if not results:
        return

    await update_share_holders(
        results=results,
        db_path=str(settings.DB_PATH),
    )


async def update_shares_event_data(
    symbol: str,
    start_date: str,
    end_date: str,
) -> None:
    """
    更新指定股票的股本变动数据。

    AkShare 是同步调用，因此放入线程中执行，
    避免阻塞 FastAPI 的事件循环。
    """

    await asyncio.to_thread(
        update_shares_events,
        symbol,
        start_date,
        end_date,
        str(settings.DB_PATH),
    )


async def update_share_data(
    symbol: str,
    start_date: str,
    end_date: str,
) -> None:
    """
    更新指定股票的全部股东/股本数据。

    1. 更新股东数据
    2. 更新股本变动数据
    """

    await update_holder_data(symbol)
    await update_shares_event_data(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
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
            print(f"❌ {symbol} 更新失败: {e}\n")


if __name__ == "__main__":
    asyncio.run(main())