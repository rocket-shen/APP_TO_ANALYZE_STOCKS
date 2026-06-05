#  -- filepath: server/app/utils/xq_a_token.py
import time
import asyncio
import logging
import traceback
from typing import Optional
import httpx
from playwright.async_api import async_playwright  # 引入 Playwright

logger = logging.getLogger(__name__)

class XueqiuCookieManager:
    
    _cookies: Optional[httpx.Cookies] = None
    _last_update: float = 0
    _ttl: int = 3000  # Token 有效期（秒）

    _lock = asyncio.Lock()

    # 保留原有的 HEADERS，供後續 httpx 請求使用
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://xueqiu.com/",
        "Connection": "keep-alive",
    }

    @classmethod
    async def get_cookies(cls) -> httpx.Cookies:
        now = time.time()
        if cls._cookies is None or (now - cls._last_update) > cls._ttl:
            async with cls._lock:
                if cls._cookies is None or (now - cls._last_update) > cls._ttl:
                    for attempt in range(2):  # 最多重試1次
                        success = await cls.refresh_cookie()
                        if success:
                            break
                        await asyncio.sleep(2)
        
        return cls._cookies or httpx.Cookies()

    @classmethod
    async def refresh_cookie(cls) -> bool:
        logger.info("[XueqiuAuth] 🚀 正在啟動自動化瀏覽器繞過阿里雲 WAF...")
        
        # 創建一個標準的 httpx CookieJar 容器
        httpx_cookies = httpx.Cookies()

        try:
            async with async_playwright() as p:
                # 啟動無頭瀏覽器（若常被風控，可改為 headless=False 調試）
                browser = await p.chromium.launch(headless=True)
                
                # 配置上下文，模擬真實瀏覽器特徵
                context = await browser.new_context(
                    user_agent=cls.HEADERS["User-Agent"],
                    viewport={"width": 1280, "height": 800},
                    locale="zh-CN"
                )
                
                # 注入防檢測腳本（防止阿里雲 WAF 識別出是 Playwright 自動化工具）
                await context.add_init_script(
                    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                )

                page = await context.new_page()
                
                # 1. 訪問雪球首頁，讓 WAF 在後台自動執行 JS Challenge
                logger.info("[XueqiuAuth] 正在載入雪球首頁...")
                await page.goto("https://xueqiu.com/", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1.5)  # 給予充裕的時間讓 JS 執行並寫入 Cookie

                # 2. 訪問一個具體的股票頁面，強制觸發 xq_a_token 的生成
                logger.info("[XueqiuAuth] 正在跳轉至個股頁面以確保 Token 生成...")
                await page.goto("https://xueqiu.com/S/SH601318", wait_until="networkidle", timeout=30000)
                await asyncio.sleep(1.5)

                # 3. 提取瀏覽器內所有的 Cookies
                playwright_cookies = await context.cookies()
                await browser.close()

                # 4. 將 Playwright 的 Cookie 格式轉換為 httpx.Cookies
                token_found = False
                token_val = None
                for ck in playwright_cookies:
                    name = ck.get("name", "")
                    value = ck.get("value", "")
                    domain = ck.get("domain", "")
                    path = ck.get("path", "/")

                    if name and value:
                        httpx_cookies.set(name, value, domain=domain, path=path)
                        if name == "xq_a_token":
                            token_found = True
                            token_val = value
                if token_found and token_val is not None:
                    cls._cookies = httpx_cookies
                    cls._last_update = time.time()
                    logger.info("[XueqiuAuth] ✅ 成功繞過 WAF 並刷新 Cookies！")
                    logger.info(f"✅ xq_a_token: {token_val[:15]}... (長度: {len(token_val)})")
                    return True
                else:
                    logger.warning("[XueqiuAuth] ❌ 未在瀏覽器中找到 xq_a_token")
                    cookie_names = [ck.get("name") for ck in playwright_cookies if ck.get("name")]
                    logger.warning(f"當前獲取到的 Cookie 鍵名: {cookie_names}")
                    return False

        except Exception as e:
            logger.error(f"[XueqiuAuth] 刷新 Cookie 失敗: {repr(e)}")
            logger.error(traceback.format_exc())
            return False

    @classmethod
    def clear_cache(cls):
        cls._cookies = None
        cls._last_update = 0
        logger.info("[XueqiuAuth] Cookie 快取已清除")


