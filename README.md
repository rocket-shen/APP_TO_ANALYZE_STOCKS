# 📊 APP_TO_ANALYZE_STOCKS

一個結合 React 前端與 FastAPI 後端的財務股票分析面板。

## ✨ 專案特色
- 即時股票資料查詢
- 技術指標分析
- 漂亮的資料視覺化介面
- 前後端分離架構（React + FastAPI）

## 🚀 如何啟動專案

### 1. 前端（React + Vite）
```bash
cd my-app
npm install
npm run dev
```

### 2. 後端（FastAPI）
```bash
cd server
pip install -r requirements.txt
# 行情 / 同步需要瀏覽器：playwright install chromium
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

可選：複製 `server/.env.example` 為 `server/.env`。`CORS_ORIGINS` 須為 JSON 陣列（見範例）；不建 `.env` 亦可使用預設值。

`GET /` 與 `/docs` 在空庫下也可通；財務 / 業績等 API 需 `server/data/financial.db` 已有 schema 與資料（或先跑 sync 灌數）。
`POST /api/v1/sync_financial_data/{symbol}` 與 `GET /api/v1/export-excel/{symbol}` 受保護：`ENV=dev` 且 `API_KEY` 為空時可直接呼叫；否則需請求頭 `X-API-Key`。兩者皆受 `RATE_LIMIT_PER_MINUTE`（依 IP / Key）限制，超限回 429。

