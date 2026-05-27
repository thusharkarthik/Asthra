from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.middleware import RequestIdMiddleware
from app.core.responses import success_response


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    @app.get("/", tags=["system"])
    def root(request: Request) -> dict:
        return success_response(
            data={
                "service": settings.app_name,
                "status": "ok",
                "docs_url": "/docs",
                "health_url": "/health",
                "ready_url": "/ready",
                "gateway_info_url": "/api/gateway/info",
            },
            request_id=getattr(request.state, "request_id", None),
        )

    @app.get("/health", tags=["health"])
    def health_check(request: Request) -> dict:
        return success_response(
            data={"status": "ok", "service": settings.app_name},
            request_id=getattr(request.state, "request_id", None),
        )

    @app.get("/ready", tags=["health"])
    def readiness_check(request: Request) -> dict:
        return success_response(
            data={"status": "ready", "gateway": "ok"},
            request_id=getattr(request.state, "request_id", None),
        )

    app.include_router(api_router)
    return app


app = create_app()
