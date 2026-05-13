import sqlite3
from fastapi import APIRouter, Request, HTTPException
from src.services.data_sync import sync_stock_data
from utilis.tools import add_stock_prefix

router = APIRouter(
    prefix="/api",
    tags=["Financial_Data"]
)

@router.get("/financial_data/{symbol}")
async def get_financial_data(symbol: str, request: Request):
    # 从预加载的状态中获取 SQL
    sql = request.app.state.queries.get("get_financial_data")
    db_path = request.app.state.db_path

    symbol = add_stock_prefix(symbol)
    
    if not sql:
        raise HTTPException(status_code=500, detail="SQL template 'get_financial_data' not found")
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql, {"symbol": symbol})
            rows = cursor.fetchall()
            
            # 统一返回：始终是列表。如果没有数据，返回空列表 []
            # 前端通过 result.length === 0 来判断是否没找到数据
            return [dict(row) for row in rows]
                
    except sqlite3.Error as e:
        # 错误处理可以保持异常抛出，FastAPI 会自动处理为 500
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
@router.post("/sync_financial_data/{symbol}")
async def sync_data(symbol: str, request: Request):
    """
    触发数据同步的接口
    """
    db_path = request.app.state.db_path
    symbol = add_stock_prefix(symbol)
    try:
        success = await sync_stock_data(symbol, db_path)
        if success:
            return {"status": "ok", "message": f"Successfully synced {symbol}"}
    except Exception as e:
        import traceback
        traceback.print_exc() # 在终端打印完整报错信息
        raise HTTPException(status_code=500, detail=str(e)) # 将错误原因返回给前端
    
@router.get("/quote_data/{symbol}")
async def get_quote_data(symbol: str):
    """
    获取股票报价数据的接口
    """
    from src.services.fetchers import fetch_xq_quote
    symbol = add_stock_prefix(symbol)
    
    try:
        quote = await fetch_xq_quote(symbol)
        return quote
    except Exception as e:
        import traceback
        traceback.print_exc() # 在终端打印完整报错信息
        raise HTTPException(status_code=500, detail=str(e)) # 将错误原因返回给前端