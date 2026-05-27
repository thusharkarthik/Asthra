from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import http_exception_handler, unhandled_exception_handler, validation_exception_handler
from app.core.responses import error_response, success_response
from app.db.session import SessionLocal


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.app_version, docs_url="/docs", redoc_url="/redoc")

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
    def root() -> dict:
        return success_response(
            data={
                "service": settings.app_name,
                "status": "ok",
                "docs_url": "/docs",
                "health_url": "/health",
                "ready_url": "/ready",
            },
        )

    @app.get("/health", tags=["health"])
    def health_check() -> dict:
        return success_response(data={"status": "ok", "service": settings.app_name})

    @app.get("/ready", tags=["health"])
    def readiness_check():
        try:
            with SessionLocal() as db:
                db.execute(text("SELECT 1"))
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=error_response(
                    message="Service is not ready.",
                    code="service_unready",
                    details={"database": "unreachable"},
                ),
            )
        return success_response(data={"status": "ready", "database": "ok"})

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
