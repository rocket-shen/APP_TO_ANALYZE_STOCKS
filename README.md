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
