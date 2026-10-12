import os

# Configure an isolated in-memory database before importing the application.
os.environ["FLASK_SECRET_KEY"] = "test-only-secret-key"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["COOKIE_SECURE"] = "false"

import pytest

from app import app, db


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    app_context = app.app_context()
    app_context.push()
    db.drop_all()
    db.create_all()
    try:
        with app.test_client() as test_client:
            yield test_client
    finally:
        db.session.remove()
        db.drop_all()
        app_context.pop()
