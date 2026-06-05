# -- filepath: server/app/main.py
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
import httpx
from contextlib import asynccontextmanager
import logging

# 正確引入 config
from app.core.config import settings

# 正確引入 router（根據你目前結構調整）
from app.api.v1.endpoints.get_financial_data import router as financial_data_router  
from app.utils.xq_a_token import XueqiuCookieManager

# 全域 logger
logger = logging.getLogger(__name__)

def load_all_queries() -> dict:
    """在新結構中載入所有 SQL 模板"""
    queries = {}
    
    # SQL 目錄位置（app/queries/）
    SQL_DIR = Path(__file__).resolve().parent / "queries"
    
    if not SQL_DIR.exists():
        logger.warning(f"⚠️ SQL 目錄不存在: {SQL_DIR}")
        # 可選擇自動建立目錄
        SQL_DIR.mkdir(parents=True, exist_ok=True)
        return queries

    for sql_file in SQL_DIR.glob("*.sql"):
        try:
            queries[sql_file.stem] = sql_file.read_text(encoding="utf-8")
            logger.info(f"✅ 已載入 SQL 模板: {sql_file.stem}")
        except Exception as e:
            logger.error(f"❌ 載入 {sql_file.name} 失敗: {e}")

    logger.info(f"總共載入 {len(queries)} 個 SQL 模板")
    return queries

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 【Startup: 啟動階段】 ---
    logger.info("應用程式啟動中...")

    # --- Startup ---
    app.state.http_client = httpx.AsyncClient(timeout=settings.TIMEOUT)
    #  提前初始化 XueqiuCookieManager，確保後續請求可用
    try:
        logger.info("[Startup] 正在初始化 Xueqiu Cookie Manager...")
        # 強制刷新一次 cookies，確保後續請求可用
        # await XueqiuCookieManager.refresh_cookie()     # ← 關鍵初始化
        cookies = await XueqiuCookieManager.get_cookies()
        logger.info(f"[Startup] Xueqiu Cookie 初始化完成，共有 {len(cookies)} 個 cookies")
    except Exception as e:
        logger.error(f"[Startup] Xueqiu Cookie 初始化失敗: {e}")
        # 不讓整個應用崩潰，只是警告

    # 載入 SQL 模板
    try:
        app.state.queries = load_all_queries()
    except Exception as e:
        logger.error(f"載入 SQL 失敗: {e}")
        app.state.queries = {}

    # 其他啟動邏輯（如載入 SQL 查詢等）可以放在這裡
    app.state.db_path = str(settings.DB_PATH)
    
    yield # ← 這裡是應用程式正常運行階段
    
    # --- 【Shutdown: 关闭阶段】 ---
    logger.info("應用程式正在關閉...")
    if hasattr(app.state, "http_client"):
        await app.state.http_client.aclose()

app = FastAPI(
    title="Stock Analysis API",
    description="FastAPI backend for stock data analysis",
    version="0.1.0",
    lifespan=lifespan,
)
# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------
# Routers
# -------------------------
app.include_router(financial_data_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "ok", "message": "Stock Analysis API is running"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, loop="asyncio", reload=True)