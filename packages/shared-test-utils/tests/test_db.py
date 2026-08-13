from sqlalchemy.orm import Session

from shared_test_utils import create_sqlite_test_engine, create_sqlite_test_session_factory


def test_sqlite_test_database_creation():
    engine = create_sqlite_test_engine()
    session_factory = create_sqlite_test_session_factory(engine)
    session = session_factory()

    try:
        assert engine.url.drivername == "sqlite"
        assert isinstance(session, Session)
    finally:
        session.close()
