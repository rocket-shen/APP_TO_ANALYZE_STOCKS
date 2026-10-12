# server/app/core/security.py
"""API key auth + simple in-memory rate limiting for sensitive routes."""
from __future__ import annotations

from collections import defaultdict, deque
from time import monotonic
from typing import Deque, Dict, Optional

from fastapi import Header, HTTPException, Request

from app.core.config import settings

# Sliding 60s window: bucket_key -> timestamps of recent requests
_rate_buckets: Dict[str, Deque[float]] = defaultdict(deque)


def _bucket_key(request: Request, api_key: Optional[str]) -> str:
    if api_key:
        return f"key:{api_key}"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    host = request.client.host if request.client else "unknown"
    return f"ip:{host}"


def _enforce_rate_limit(bucket_key: str) -> None:
    limit = settings.RATE_LIMIT_PER_MINUTE
    if limit <= 0:
        return
    now = monotonic()
    window = 60.0
    q = _rate_buckets[bucket_key]
    while q and now - q[0] >= window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    q.append(now)


async def require_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> None:
    """Protect sync/export: require X-API-Key unless ENV=dev and API_KEY is empty."""
    configured = (settings.API_KEY or "").strip()

    if not configured:
        if settings.ENV.strip().lower() != "dev":
            raise HTTPException(
                status_code=503,
                detail="API_KEY is not configured",
            )
        _enforce_rate_limit(_bucket_key(request, None))
        return

    if not x_api_key or x_api_key != configured:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    _enforce_rate_limit(_bucket_key(request, x_api_key))
