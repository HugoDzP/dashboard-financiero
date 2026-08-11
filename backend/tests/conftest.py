import os

import pytest

os.environ.setdefault("DATABASE_URL", "sqlite://")  # sqlite en memoria para tests

from app import create_app
from app.extensions import db as _db


@pytest.fixture()
def app():
    application = create_app("development")
    application.config.update(TESTING=True)

    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    """Registra un usuario de prueba y devuelve las cabeceras con su token."""
    resp = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "supersecreto123", "display_name": "Test"},
    )
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
