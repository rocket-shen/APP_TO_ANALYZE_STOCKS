# --filepath--: server/app/utils/manual_xq_cookies.py
import time
import asyncio
import logging
import traceback
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

class XueqiuCookieManager:
    
    _cookies: Optional[httpx.Cookies] = None
    _last_update: float = 0
    _ttl: int = 3600  # 改成1小時，手動更新後比較久
    _lock = asyncio.Lock()

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/avif,image/webp,*/*;q=0.8"
        ),
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://xueqiu.com/",
        "Connection": "keep-alive",
        "DNT": "1",
    }

    # === 新增：手動設定 Token ===
    _manual_token: Optional[str] = None

    @classmethod
    def set_manual_token(cls, cookie_string: str):
        """從瀏覽器複製整串 Cookie 後，傳入這裡"""
        cls._manual_token = cookie_string
        cls._cookies = httpx.Cookies()
        # 解析 cookie 字串
        for item in cookie_string.split(';'):
            item = item.strip()
            if '=' in item:
                k, v = item.split('=', 1)
                cls._cookies.set(k, v)
        cls._last_update = time.time()
        logger.info("[XueqiuAuth] ✅ 已手動設定 Cookie")
        logger.info(f"包含 xq_a_token: {bool(cls._cookies.get('xq_a_token'))}")

    @classmethod
    async def get_cookies(cls) -> httpx.Cookies:
        if cls._manual_token:
            return cls._cookies or httpx.Cookies()
        
        # 原有自動刷新邏輯（目前效果差，先保留）
        now = time.time()
        if cls._cookies is None or (now - cls._last_update) > cls._ttl:
            async with cls._lock:
                if cls._cookies is None or (now - cls._last_update) > cls._ttl:
                    await cls.refresh_cookie()
        
        return cls._cookies or httpx.Cookies()

    @classmethod
    async def refresh_cookie(cls):
        logger.info("[XueqiuAuth] Start refreshing cookies...")

        try:
            async with httpx.AsyncClient(
                headers=cls.HEADERS,
                follow_redirects=True,
                timeout=20.0,          # 显著提高超时
            ) as client:
                
                # 只做最有效的两步
                await client.get("https://xueqiu.com/")
                await asyncio.sleep(0.8)
                
                # 访问真实股票页面（最容易拿到 token）
                await client.get("https://xueqiu.com/S/SH601318")  # 换成更活跃的股票，如中国平安
                
                token = client.cookies.get("xq_a_token")
                await asyncio.sleep(1.2)

                if token:
                    cls._cookies = httpx.Cookies(client.cookies)
                    cls._last_update = time.time()
                    logger.info("[XueqiuAuth] ✅ Successfully refreshed cookies")
                    logger.info(f"✅ xq_a_token: {token[:15]}... (length: {len(token)})")
                    logger.info(f"Cookie keys: {list(client.cookies.keys())}")
                    return True
                else:
                    logger.warning("[XueqiuAuth] ❌ No xq_a_token found")
                    logger.warning(f"Current cookies: {dict(client.cookies)}")
                    return False

        except httpx.ReadTimeout:
            logger.warning("[XueqiuAuth] Refresh timeout")
        except Exception as e:
            logger.error(f"[XueqiuAuth] Refresh error: {repr(e)}")
            logger.error(traceback.format_exc())
        
        return False