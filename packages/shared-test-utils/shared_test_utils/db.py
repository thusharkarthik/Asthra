from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def create_sqlite_test_engine(database_url: str = "sqlite:///:memory:"):
    return create_engine(database_url, connect_args={"check_same_thread": False})


def create_sqlite_test_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
