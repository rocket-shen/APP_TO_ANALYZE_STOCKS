import asyncio
import logging
from app.core.config import settings
from app.services.fetchers import fetch_share_change
from app.crud.update_share_holders import update_share_holders
from app.crud.update_shares_events import update_shares_events
from app.services.fetchers import fetch_xq_holders
from app.utils.tools import add_stock_prefix
from datetime import date

logger = logging.getLogger(__name__)

async def update_holder_data(symbol: str) -> None:
    """
    更新指定股票的股东数据。
    """

    prefix_symbol = add_stock_prefix(symbol)

    results = await fetch_xq_holders(prefix_symbol)

    if not results:
        logger.warning("无雪球股东数据，跳过写入: %s", symbol)
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
    df = await asyncio.to_thread(
        fetch_share_change,
        symbol,
        start_date,
        end_date,
    )
    if df.empty:
        logger.warning("无股本变动数据，跳过写入: %s", symbol)
        return

    await asyncio.to_thread(
        update_shares_events,
        df,
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
    await update_shares_event_data(symbol, start_date, end_date)
    

