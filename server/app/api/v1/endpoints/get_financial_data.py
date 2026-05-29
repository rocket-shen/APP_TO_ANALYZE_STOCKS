# -- filepath: server/app/api/v1/endpoints/get_financial_data.py
import sqlite3
from fastapi import APIRouter, Request, HTTPException, Query
from pathlib import Path
from app.core.config import settings
from app.services.data_sync import sync_stock_data
from app.services.download_report import save_financial_reports_to_excel
from app.utils.tools import add_stock_prefix

router = APIRouter(
    tags=["Financial_Data"]
)

@router.get("/financial_data/{symbol}")
async def get_financial_data(symbol: str, request: Request):
    # 从预加载的状态中获取 SQL
    sql = request.app.state.queries.get("get_financial_data")

    if not sql:
        raise HTTPException(status_code=500, detail="SQL template 'get_financial_data' not found")

    symbol = add_stock_prefix(symbol)
    try:
        with sqlite3.connect(str(settings.DB_PATH)) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql, {"symbol": symbol})
            rows = cursor.fetchall()
            
            # 统一返回：始终是列表。如果没有数据，返回空列表 []
            # 前端通过 result.length === 0 来判断是否没找到数据
            return [dict(row) for row in rows]
                
    except sqlite3.Error as e:
        # 错误处理可以保持异常抛出，FastAPI 会自动处理为 500
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
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

    except sqlite3.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    
@router.post("/sync_financial_data/{symbol}")
async def sync_data(symbol: str, request: Request):
    """
    触发数据同步的接口
    """
    symbol = add_stock_prefix(symbol)
    try:
        success = await sync_stock_data(symbol)
        if success:
            return {"status": "ok", "message": f"Successfully synced {symbol}"}
        else:
            return {"status": "fail", "message": f"Sync {symbol} returned false"}
    except Exception as e:
        import traceback
        traceback.print_exc() # 在终端打印完整报错信息
        raise HTTPException(status_code=500, detail=str(e)) # 将错误原因返回给前端
    
@router.get("/quote_data/{symbol}")
async def get_quote_data(symbol: str):
    """
    获取股票报价数据的接口
    """
    from app.services.fetchers import fetch_xq_quote
    symbol = add_stock_prefix(symbol)
    
    try:
        quote = await fetch_xq_quote(symbol)
        return quote
    except Exception as e:
        import traceback
        traceback.print_exc() # 在终端打印完整报错信息
        raise HTTPException(status_code=500, detail=str(e)) # 将错误原因返回给前端
    
@router.get("/export-excel/{symbol}")
async def export_financial_reports(
    symbol: str,
    use_db: bool = Query(True, description="是否從資料庫讀取")
):
    """
    將指定股票的財務報表匯出為 Excel 檔案
    """
    symbol = add_stock_prefix(symbol)
    try:
        file_path = await save_financial_reports_to_excel(
            symbol=symbol.upper(),
            db_path=str(settings.DB_PATH),           # 確保是字串
            folder_path=str(settings.DEFAULT_EXPORT_DIR),
            use_db=use_db
        )
        
        return {
            "status": "success",
            "message": f"{symbol} 財務報表匯出成功",
            "file_path": str(file_path),
            "file_name": Path(file_path).name
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    