import time
import asyncio
import httpx
from typing import Optional

class XueqiuCookieManager:
    _cookie: Optional[str] = None
    _last_update: float = 0
    _ttl: int = 3600
    _lock = asyncio.Lock()

    # 模拟最真实的浏览器 Headers
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://xueqiu.com/",
        "DNT": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }

    @classmethod
    async def get_cookie(cls, client: httpx.AsyncClient) -> str:
        now = time.time()
        if not cls._cookie or (now - cls._last_update) > cls._ttl:
            async with cls._lock:
                if not cls._cookie or (now - cls._last_update) > cls._ttl:
                    await cls.refresh_cookie(client)
        return cls._cookie or ""

    @classmethod
    async def refresh_cookie(cls, client: httpx.AsyncClient):
        """
        采用两次访问法，确保绕过防火墙拿到 xq_a_token
        """
        try:
            # 清理旧 Cookie
            client.cookies.clear()
            
            # 第一步：访问首页，获取基础的 acw_tc
            # 使用 URL_HQ (通常是 https://xueqiu.com/)
            url_home = "https://xueqiu.com/"
            resp1 = await client.get(url_home, headers=cls.HEADERS, follow_redirects=True, timeout=10.0)
            
            # 稍作停顿，模拟真实用户（可选，约 100ms）
            await asyncio.sleep(0.1)

            # 第二步：再次访问首页（此时 client 已经自动带上了第一步拿到的 acw_tc）
            # 这次访问通常会触发服务器下发 xq_a_token
            resp2 = await client.get(url_home, headers=cls.HEADERS, follow_redirects=True, timeout=10.0)

            if "xq_a_token" in client.cookies:
                cls._save_cookies(client.cookies)
                print(f"[XueqiuAuth] Successfully captured: {list(client.cookies.keys())}")
            else:
                # 第三步：如果还没拿到，尝试访问一个具体的行情页面（这是你的原方案 URL_HQ 的逻辑）
                # 某些时候首页不给 token，但具体行情页给
                url_hq = "https://xueqiu.com/hq" 
                await client.get(url_hq, headers=cls.HEADERS, follow_redirects=True)
                
                if "xq_a_token" in client.cookies:
                    cls._save_cookies(client.cookies)
                    print(f"[XueqiuAuth] Captured from HQ page: {list(client.cookies.keys())}")
                else:
                    print(f"[XueqiuAuth] Still no token. Jar: {list(client.cookies.keys())}")

        except Exception as e:
            print(f"[XueqiuAuth] Critical error during refresh: {str(e)}")

    @classmethod
    def _save_cookies(cls, cookie_jar):
        """将 cookie 罐子里的内容格式化为字符串"""
        items = [f"{k}={v}" for k, v in cookie_jar.items()]
        cls._cookie = "; ".join(items)
        cls._last_update = time.time()

    @classmethod
    def clear_cache(cls):
        cls._cookie = None
        cls._last_update = 0