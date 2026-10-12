# 📊 APP_TO_ANALYZE_STOCKS

一個結合 React 前端與 FastAPI 後端的財務股票分析面板。

## ✨ 專案特色
- 即時股票資料查詢
- 技術指標分析
- 漂亮的資料視覺化介面
- 前後端分離架構（React + FastAPI）
- 單用戶登入（HttpOnly Cookie）後才可查詢 / 更新 / 下載

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

### 登入（AUTH_*）

| 變數 | 說明 |
|------|------|
| `AUTH_USERNAME` | 登入用戶名（預設 `admin`） |
| `AUTH_PASSWORD` | 登入密碼。**為空且 `ENV=dev` 時不強制登入**；設了密碼則查詢 / 同步 / 下載都要先登入 |
| `AUTH_SECRET` | 簽發 Cookie 的密鑰；**設了 `AUTH_PASSWORD` 時必填** |

登入成功後瀏覽器會拿到 HttpOnly Cookie（預設名 `stocks_session`，SameSite=Lax，約 7 天）。前後端同域部署（例如 nginx 反代靜態頁 + `/api`）時 **不必改 nginx Cookie 設定**。

生產環境範例：

```bash
ENV=prod
AUTH_USERNAME=admin
AUTH_PASSWORD=your-strong-password
AUTH_SECRET=long-random-string
API_KEY=your-api-key   # 可選：同步/下載額外校驗；nginx 可代填 X-API-Key
```

`GET /` 與 `/docs`、登入頁在空庫下也可通；財務 / 業績等 API 需 `server/data/financial.db` 已有 schema 與資料（或先跑 sync 灌數），且在啟用 `AUTH_PASSWORD` 時需已登入。
`POST /api/v1/sync_financial_data/{symbol}` 與 `GET /api/v1/export-excel/{symbol}`：需登入（當 `AUTH_PASSWORD` 已設）；若配置了 `API_KEY` 還需 `X-API-Key`。兩者皆受 `RATE_LIMIT_PER_MINUTE`（依 IP / Key）限制，超限回 429。
