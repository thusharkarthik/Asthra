from sqlalchemy.orm import Session

from shared_db import check_database_health, create_engine_from_url, create_session_factory, get_db_session_dependency


def test_engine_creation_with_sqlite():
    engine = create_engine_from_url("sqlite:///:memory:")

    assert engine.url.drivername == "sqlite"


def test_session_factory_creation():
    engine = create_engine_from_url("sqlite:///:memory:")
    session_factory = create_session_factory(engine)
    session = session_factory()

    try:
        assert isinstance(session, Session)
    finally:
        session.close()


def test_get_db_session_dependency():
    engine = create_engine_from_url("sqlite:///:memory:")
    session_factory = create_session_factory(engine)
    dependency = get_db_session_dependency(session_factory)
    generator = dependency()
    session = next(generator)

    assert isinstance(session, Session)
    try:
        next(generator)
    except StopIteration:
        pass


def test_database_health_success():
    engine = create_engine_from_url("sqlite:///:memory:")

    assert check_database_health(engine) is True
