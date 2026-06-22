def test_app_main_imports():
    from app.main import app

    assert app.title == "asthra-core-service"
