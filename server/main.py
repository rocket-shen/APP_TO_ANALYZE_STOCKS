from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
import httpx
from contextlib import asynccontextmanager
import logging
from src.routers.get_financial_data import router as financial_data_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


try:
    # 正常 python server/main.py 或 uvicorn server.main:app 時
    BASE_DIR = Path(__file__).resolve().parent
except NameError:
    # 在某些 IDE / jupyter / pytest 等環境下 __file__ 可能不存在
    BASE_DIR = Path.cwd().resolve()

DB_PATH = BASE_DIR  / "data" / "financial.db"
SQL_DIR = BASE_DIR  / "src" / "queries"

def load_all_queries():
    """扫描目录并加载所有 .sql 文件到字典"""
    queries = {}
    if not SQL_DIR.exists():
        # 如果目录不存在，抛出警告或创建它
        return queries
    
    for sql_file in SQL_DIR.glob("*.sql"):
        # 以文件名作为键（去掉扩展名），读取内容作为值
        queries[sql_file.stem] = sql_file.read_text(encoding="utf-8")
    return queries


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 【Startup: 启动阶段】 ---
    # 1. 初始化 HTTP 客户端
    app.state.http_client = httpx.AsyncClient(timeout=10)
    
    # 2. 预加载 SQL 模板
    # 注入全局变量
    app.state.db_path = str(DB_PATH)
    app.state.queries = load_all_queries()
    
    yield
    
    # --- 【Shutdown: 关闭阶段】 ---
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
app.include_router(financial_data_router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Stock Analysis API is running"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)