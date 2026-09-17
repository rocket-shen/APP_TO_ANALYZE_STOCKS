# server/app/core/errors.py
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("app")

# 这些状态码代表“调用方的问题”，可以把 detail 给前端
SAFE_STATUS = {400, 401, 403, 404, 409, 422, 429}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exc_handler(request: Request, exc: HTTPException):
        if exc.status_code in SAFE_STATUS:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )

        logger.exception(
            "HTTP %s on %s: %s",
            exc.status_code,
            request.url.path,
            exc.detail,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": "Internal server error"},
        )

    @app.exception_handler(Exception)
    async def unhandled_exc_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )