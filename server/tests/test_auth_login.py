# server/tests/test_auth_login.py
"""Auth login / cookie / require_login — no DB required."""
from __future__ import annotations

import importlib

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient


def _reload_settings(**env):
    """Patch env and reload config + security modules."""
    import os

    for key, value in env.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value

    import app.core.config as config_mod
    import app.core.security as security_mod
    import app.api.v1.endpoints.auth as auth_mod

    importlib.reload(config_mod)
    importlib.reload(security_mod)
    importlib.reload(auth_mod)
    return config_mod.settings, security_mod, auth_mod


def _make_app(security_mod, auth_mod):
    app = FastAPI()
    app.include_router(auth_mod.router, prefix="/api/v1")

    @app.get("/api/v1/protected", dependencies=[Depends(security_mod.require_login)])
    async def protected():
        return {"ok": True}

    return app


@pytest.fixture
def auth_enabled(monkeypatch, tmp_path):
    # Point DB paths at tmp so Settings.ensure_dirs is harmless
    monkeypatch.setenv("ENV", "dev")
    monkeypatch.setenv("AUTH_USERNAME", "admin")
    monkeypatch.setenv("AUTH_PASSWORD", "secret-pass")
    monkeypatch.setenv("AUTH_SECRET", "unit-test-secret-key-32chars!!")
    monkeypatch.setenv("DB_PATH", str(tmp_path / "financial.db"))
    monkeypatch.setenv("DEFAULT_EXPORT_DIR", str(tmp_path / "exports"))
    monkeypatch.setenv("STOCK_DICT_A_PATH", str(tmp_path / "stock_dict_a.npy"))
    monkeypatch.setenv("API_KEY", "")

    settings, security_mod, auth_mod = _reload_settings(
        ENV="dev",
        AUTH_USERNAME="admin",
        AUTH_PASSWORD="secret-pass",
        AUTH_SECRET="unit-test-secret-key-32chars!!",
        DB_PATH=str(tmp_path / "financial.db"),
        DEFAULT_EXPORT_DIR=str(tmp_path / "exports"),
        STOCK_DICT_A_PATH=str(tmp_path / "stock_dict_a.npy"),
        API_KEY="",
    )
    app = _make_app(security_mod, auth_mod)
    return TestClient(app), settings


@pytest.fixture
def auth_disabled_dev(monkeypatch, tmp_path):
    monkeypatch.setenv("ENV", "dev")
    monkeypatch.setenv("AUTH_USERNAME", "admin")
    monkeypatch.setenv("AUTH_PASSWORD", "")
    monkeypatch.setenv("AUTH_SECRET", "")
    monkeypatch.setenv("DB_PATH", str(tmp_path / "financial.db"))
    monkeypatch.setenv("DEFAULT_EXPORT_DIR", str(tmp_path / "exports"))
    monkeypatch.setenv("STOCK_DICT_A_PATH", str(tmp_path / "stock_dict_a.npy"))

    settings, security_mod, auth_mod = _reload_settings(
        ENV="dev",
        AUTH_USERNAME="admin",
        AUTH_PASSWORD="",
        AUTH_SECRET="",
        DB_PATH=str(tmp_path / "financial.db"),
        DEFAULT_EXPORT_DIR=str(tmp_path / "exports"),
        STOCK_DICT_A_PATH=str(tmp_path / "stock_dict_a.npy"),
        API_KEY="",
    )
    app = _make_app(security_mod, auth_mod)
    return TestClient(app), settings


def test_me_unauthenticated(auth_enabled):
    client, _ = auth_enabled
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["authenticated"] is False
    assert body["auth_required"] is True


def test_protected_returns_401_without_cookie(auth_enabled):
    client, _ = auth_enabled
    r = client.get("/api/v1/protected")
    assert r.status_code == 401


def test_login_sets_cookie_and_me(auth_enabled):
    client, settings = auth_enabled
    r = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "secret-pass"},
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert settings.AUTH_COOKIE_NAME in r.cookies

    r2 = client.get("/api/v1/auth/me")
    assert r2.status_code == 200
    assert r2.json()["authenticated"] is True
    assert r2.json()["username"] == "admin"

    r3 = client.get("/api/v1/protected")
    assert r3.status_code == 200
    assert r3.json()["ok"] is True


def test_login_wrong_password(auth_enabled):
    client, _ = auth_enabled
    r = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert r.status_code == 401


def test_logout_clears_session(auth_enabled):
    client, _ = auth_enabled
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "secret-pass"},
    )
    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    r2 = client.get("/api/v1/protected")
    assert r2.status_code == 401


def test_dev_without_password_skips_auth(auth_disabled_dev):
    client, _ = auth_disabled_dev
    r = client.get("/api/v1/protected")
    assert r.status_code == 200
    me = client.get("/api/v1/auth/me").json()
    assert me["authenticated"] is True
    assert me["auth_required"] is False
