from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.responses import error_response, success_response
from app.db.base import Base
from app.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_flow_sqlite_columns()
    yield


def ensure_flow_sqlite_columns() -> None:
    if engine.dialect.name != "sqlite":
        return
    expected_work_item_columns = {
        "effort_score": "INTEGER",
        "item_level": "VARCHAR(30) DEFAULT 'work_item' NOT NULL",
        "effort_size": "VARCHAR(10)",
        "business_value": "VARCHAR(20)",
        "risk_level": "VARCHAR(20)",
        "complexity": "VARCHAR(20)",
        "acceptance_criteria": "TEXT",
        "definition_of_done": "TEXT",
        "sprint_id": "INTEGER",
        "release_id": "INTEGER",
        "original_estimate_minutes": "INTEGER",
        "remaining_estimate_minutes": "INTEGER",
    }
    with engine.begin() as connection:
        existing = {
            row[1]
            for row in connection.execute(text("PRAGMA table_info(work_items)")).fetchall()
        }
        for column_name, column_type in expected_work_item_columns.items():
            if column_name not in existing:
                connection.execute(text(f"ALTER TABLE work_items ADD COLUMN {column_name} {column_type}"))
        existing_attachments = {
            row[1]
            for row in connection.execute(text("PRAGMA table_info(work_item_attachments)")).fetchall()
        }
        if "uploaded_at" not in existing_attachments:
            connection.execute(text("ALTER TABLE work_item_attachments ADD COLUMN uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL"))
        existing_statuses = {
            row[1]
            for row in connection.execute(text("PRAGMA table_info(work_item_statuses)")).fetchall()
        }
        if "workflow_id" not in existing_statuses:
            connection.execute(text("ALTER TABLE work_item_statuses ADD COLUMN workflow_id INTEGER"))
        if "key" not in existing_statuses:
            connection.execute(text("ALTER TABLE work_item_statuses ADD COLUMN key VARCHAR(100) DEFAULT '' NOT NULL"))
        status_table_sql = connection.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='work_item_statuses'")
        ).scalar() or ""
        has_unique_status_name_index = False
        for index_row in connection.execute(text("PRAGMA index_list(work_item_statuses)")).fetchall():
            index_name = index_row[1]
            is_unique = bool(index_row[2])
            if not is_unique:
                continue
            index_columns = {column_row[2] for column_row in connection.execute(text(f"PRAGMA index_info({index_name})")).fetchall()}
            if "name" in index_columns:
                has_unique_status_name_index = True
                break
        if ("UNIQUE" in status_table_sql.upper() and "NAME" in status_table_sql.upper()) or has_unique_status_name_index:
            connection.execute(text("PRAGMA foreign_keys=OFF"))
            connection.execute(
                text(
                    """
                    CREATE TABLE work_item_statuses_rebuilt (
                        id INTEGER NOT NULL,
                        workflow_id INTEGER,
                        name VARCHAR(100) NOT NULL,
                        key VARCHAR(100) DEFAULT '' NOT NULL,
                        description TEXT,
                        category VARCHAR(50) DEFAULT 'todo' NOT NULL,
                        sort_order INTEGER DEFAULT 0 NOT NULL,
                        is_active BOOLEAN DEFAULT 1 NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        PRIMARY KEY (id),
                        FOREIGN KEY(workflow_id) REFERENCES workflows (id)
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    INSERT INTO work_item_statuses_rebuilt (
                        id, workflow_id, name, key, description, category, sort_order, is_active, created_at, updated_at
                    )
                    SELECT
                        id,
                        workflow_id,
                        name,
                        COALESCE(NULLIF(key, ''), lower(replace(name, ' ', '_'))),
                        description,
                        category,
                        sort_order,
                        is_active,
                        created_at,
                        updated_at
                    FROM work_item_statuses
                    """
                )
            )
            connection.execute(text("DROP TABLE work_item_statuses"))
            connection.execute(text("ALTER TABLE work_item_statuses_rebuilt RENAME TO work_item_statuses"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_work_item_statuses_id ON work_item_statuses (id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_work_item_statuses_key ON work_item_statuses (key)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_work_item_statuses_workflow_id ON work_item_statuses (workflow_id)"))
            connection.execute(text("PRAGMA foreign_keys=ON"))


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

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
