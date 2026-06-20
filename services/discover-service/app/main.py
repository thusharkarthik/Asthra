from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import http_exception_handler, unhandled_exception_handler, validation_exception_handler
from app.core.responses import error_response, success_response
from app.db.base import Base
from app.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_operational_columns()
    yield


def _ensure_operational_columns() -> None:
    inspector = inspect(engine)
    if "ideas" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("ideas")}
    statements = []
    if "business_value" not in existing:
        statements.append("ALTER TABLE ideas ADD COLUMN business_value TEXT")
    if "impact_score" not in existing:
        statements.append("ALTER TABLE ideas ADD COLUMN impact_score FLOAT")
    if "confidence_score" not in existing:
        statements.append("ALTER TABLE ideas ADD COLUMN confidence_score FLOAT")
    if "effort_score" not in existing:
        statements.append("ALTER TABLE ideas ADD COLUMN effort_score FLOAT")
    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.app_version, docs_url="/docs", redoc_url="/redoc", lifespan=lifespan)

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

    @app.get(f"{settings.api_v1_prefix}/system/info", tags=["system"])
    def system_info() -> dict:
        return success_response(
            data={
                "service": settings.app_name,
                "version": settings.app_version,
                "environment": settings.environment,
                "api_prefix": settings.api_v1_prefix,
            }
        )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
