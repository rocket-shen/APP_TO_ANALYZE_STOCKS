# server/app/api/v1/endpoints/auth.py
"""Single-user login / logout / session check."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import (
    clear_session_cookie,
    create_session_token,
    set_session_cookie,
    validate_credentials,
    verify_session_token,
)

router = APIRouter(tags=["Auth"])


class LoginBody(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


@router.post("/auth/login")
async def login(body: LoginBody, response: Response):
    """Set HttpOnly session cookie on success."""
    if not settings.auth_enabled:
        if not settings.is_dev:
            raise HTTPException(
                status_code=503,
                detail="AUTH_PASSWORD is not configured",
            )
        # Dev with no password: issue a cookie so the UI can stay logged in
        username = (settings.AUTH_USERNAME or "admin").strip()
        if (settings.AUTH_SECRET or "").strip():
            set_session_cookie(response, create_session_token(username))
        return {"ok": True, "username": username, "auth_required": False}

    if not (settings.AUTH_SECRET or "").strip():
        raise HTTPException(status_code=503, detail="AUTH_SECRET is not configured")

    if not validate_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    username = (settings.AUTH_USERNAME or "admin").strip()
    set_session_cookie(response, create_session_token(username))
    return {"ok": True, "username": username}


@router.post("/auth/logout")
async def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/auth/me")
async def me(request: Request):
    """Return current session status (no hard 401 — used by the login gate)."""
    if not settings.auth_enabled:
        if not settings.is_dev:
            return {"authenticated": False, "auth_required": True}
        return {
            "authenticated": True,
            "username": (settings.AUTH_USERNAME or "admin").strip(),
            "auth_required": False,
        }

    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    username = None
    if token and (settings.AUTH_SECRET or "").strip():
        try:
            username = verify_session_token(token)
        except HTTPException:
            username = None

    if username:
        return {
            "authenticated": True,
            "username": username,
            "auth_required": True,
        }
    return {"authenticated": False, "auth_required": True}
