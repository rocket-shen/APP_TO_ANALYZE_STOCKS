# -- filepath: server/app/api/v1/endpoints/get_financial_data.py
import logging
import sqlite3
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.data_sync import sync_stock_data
from app.services.download_report import save_financial_reports_to_excel
from app.utils.tools import add_stock_prefix

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Financial_Data"]
)

@router.get("/financial_data/{symbol}")
async def get_financial_data(symbol: str, request: Request):
    sql = request.app.state.queries.get("get_financial_data")

    if not sql:
        raise HTTPException(status_code=500, detail="SQL template 'get_financial_data' not found")

    symbol = add_stock_prefix(symbol)
    try:
        with sqlite3.connect(str(settings.DB_PATH)) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql, {"symbol": symbol})
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    except sqlite3.Error:
        logger.exception("DB query failed for financial_data symbol=%s", symbol)
        raise HTTPException(status_code=500, detail="Database error")

@router.get("/financial_performance/{code}")
async def get_financial_performance(code: str, request: Request):
    sql = request.app.state.queries.get("get_financial_performance")

    if not sql:
        raise HTTPException(
            status_code=500,
            detail="SQL template 'get_financial_performance' not found"
        )

    try:
        with sqlite3.connect(str(settings.DB_PATH)) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql, {"code": code})
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    except sqlite3.Error:
        logger.exception("DB query failed for financial_performance code=%s", code)
        raise HTTPException(
            status_code=500,
            detail="Database error"
        )

@router.post("/sync_financial_data/{symbol}")
async def sync_data(symbol: str, request: Request):
    symbol = add_stock_prefix(symbol)
    try:
        success = await sync_stock_data(symbol)
        if success:
            return {"status": "ok", "message": f"Successfully synced {symbol}"}
        return {"status": "fail", "message": f"Sync {symbol} returned false"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Sync failed for symbol=%s", symbol)
        raise HTTPException(status_code=500, detail="Failed to sync data")

@router.get("/quote_data/{symbol}")
async def get_quote_data(symbol: str):
    from app.services.fetchers import fetch_xq_quote
    symbol = add_stock_prefix(symbol)

    try:
        quote = await fetch_xq_quote(symbol)
        return quote
    except Exception:
        logger.exception("Quote fetch failed for symbol=%s", symbol)
        raise HTTPException(status_code=500, detail="Failed to fetch quote")

@router.get("/export-excel/{symbol}")
async def export_financial_reports(
    symbol: str,
    use_db: bool = Query(True, description="是否從資料庫讀取")
):
    """將財報寫入伺服器磁碟，並以 xlsx 二進位流回傳給瀏覽器下載。"""
    try:
        symbol = add_stock_prefix(symbol)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        file_path = await save_financial_reports_to_excel(
            symbol=symbol.upper(),
            db_path=str(settings.DB_PATH),
            folder_path=str(settings.DEFAULT_EXPORT_DIR),
            use_db=use_db,
        )
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(str(path))

        return FileResponse(
            path=str(path),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=path.name,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError:
        logger.exception("Excel file missing after export symbol=%s", symbol)
        raise HTTPException(status_code=500, detail="Failed to export excel")
    except Exception:
        logger.exception("Excel export failed for symbol=%s", symbol)
        raise HTTPException(status_code=500, detail="Failed to export excel")
