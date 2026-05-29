#  -- filepath: server/app/utils/xq_cookies.py
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
    _ttl: int = 3000

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

    @classmethod
    async def get_cookies(cls) -> httpx.Cookies:
        now = time.time()
        if cls._cookies is None or (now - cls._last_update) > cls._ttl:
            async with cls._lock:
                if cls._cookies is None or (now - cls._last_update) > cls._ttl:
                    for attempt in range(2):  # 最多重试1次
                        success = await cls.refresh_cookie()
                        if success:
                            break
                        await asyncio.sleep(1)
        
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
                await asyncio.sleep(0.5)
                
                # 访问真实股票页面（最容易拿到 token）
                await client.get("https://xueqiu.com/S/SH601318")  # 换成更活跃的股票，如中国平安
                
                token = client.cookies.get("xq_a_token")
                
                if token:
                    cls._cookies = httpx.Cookies(client.cookies)
                    cls._last_update = time.time()
                    logger.info("[XueqiuAuth] ✅ Successfully refreshed cookies")
                    logger.info(f"Cookie keys: {list(client.cookies.keys())}")
                    return True
                else:
                    logger.warning("[XueqiuAuth] ❌ No xq_a_token found")
                    return False

        except httpx.ReadTimeout:
            logger.warning("[XueqiuAuth] Refresh timeout")
        except Exception as e:
            logger.error(f"[XueqiuAuth] Refresh error: {repr(e)}")
            logger.error(traceback.format_exc())
        
        return False

    @classmethod
    def clear_cache(cls):
        """
        清除缓存
        """
        cls._cookies = None
        cls._last_update = 0

        logger.info("[XueqiuAuth] Cookie cache cleared")
