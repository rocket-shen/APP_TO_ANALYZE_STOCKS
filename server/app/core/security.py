# server/app/core/security.py
"""API key auth, cookie session login, and simple in-memory rate limiting."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict, deque
from time import monotonic
from typing import Deque, Dict, Optional

from fastapi import Header, HTTPException, Request, Response

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
        if not settings.is_dev:
            raise HTTPException(
                status_code=503,
                detail="API_KEY is not configured",
            )
        _enforce_rate_limit(_bucket_key(request, None))
        return

    if not x_api_key or x_api_key != configured:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    _enforce_rate_limit(_bucket_key(request, x_api_key))


# ---------------------------------------------------------------------------
# Single-user signed session cookie
# ---------------------------------------------------------------------------

def _secure_str_eq(a: str, b: str) -> bool:
    a_b, b_b = a.encode("utf-8"), b.encode("utf-8")
    if len(a_b) != len(b_b):
        secrets.compare_digest(a_b, a_b)
        return False
    return secrets.compare_digest(a_b, b_b)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def _signing_secret() -> bytes:
    secret = (settings.AUTH_SECRET or "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="AUTH_SECRET is not configured")
    return secret.encode("utf-8")


def create_session_token(username: str) -> str:
    """Create an HMAC-signed session token (payload.signature)."""
    payload = {
        "u": username,
        "exp": int(time.time()) + int(settings.AUTH_COOKIE_MAX_AGE),
    }
    body = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(_signing_secret(), body.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def verify_session_token(token: str) -> Optional[str]:
    """Return username if token is valid, else None."""
    try:
        body, sig = token.rsplit(".", 1)
        expected = hmac.new(
            _signing_secret(), body.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        payload = json.loads(_b64url_decode(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        username = payload.get("u")
        return username if isinstance(username, str) and username else None
    except HTTPException:
        raise
    except Exception:
        return None


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=not settings.is_dev,
        max_age=int(settings.AUTH_COOKIE_MAX_AGE),
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        samesite="lax",
        secure=not settings.is_dev,
    )


def validate_credentials(username: str, password: str) -> bool:
    expected_user = (settings.AUTH_USERNAME or "admin").strip()
    expected_pass = settings.AUTH_PASSWORD or ""
    return _secure_str_eq(username.strip(), expected_user) and _secure_str_eq(
        password, expected_pass
    )


async def require_login(request: Request) -> str:
    """Require a valid session cookie when AUTH_PASSWORD is set.

    When AUTH_PASSWORD is empty and ENV=dev, auth is skipped (local convenience).
    When AUTH_PASSWORD is empty and ENV!=dev, returns 503.
    """
    if not settings.auth_enabled:
        if not settings.is_dev:
            raise HTTPException(
                status_code=503,
                detail="AUTH_PASSWORD is not configured",
            )
        return (settings.AUTH_USERNAME or "admin").strip()

    if not (settings.AUTH_SECRET or "").strip():
        raise HTTPException(status_code=503, detail="AUTH_SECRET is not configured")

    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    username = verify_session_token(token) if token else None
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return username
