from collections.abc import Callable, Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker


def create_engine_from_url(database_url: str, **kwargs) -> Engine:
    connect_args = kwargs.pop("connect_args", None)
    if connect_args is None and database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(database_url, connect_args=connect_args or {}, **kwargs)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session_dependency(session_factory: sessionmaker[Session]) -> Callable[[], Generator[Session, None, None]]:
    def get_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    return get_db
