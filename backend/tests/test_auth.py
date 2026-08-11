def test_register_creates_user_and_returns_tokens(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "hugo@example.com", "password": "supersecreto123", "display_name": "Hugo"},
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user"]["email"] == "hugo@example.com"
    assert "access_token" in body
    assert "refresh_token" in body


def test_register_rejects_short_password(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "hugo@example.com", "password": "corta", "display_name": "Hugo"},
    )
    assert resp.status_code == 400


def test_register_rejects_duplicate_email(client):
    payload = {"email": "hugo@example.com", "password": "supersecreto123", "display_name": "Hugo"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_with_correct_credentials(client):
    client.post(
        "/api/auth/register",
        json={"email": "hugo@example.com", "password": "supersecreto123", "display_name": "Hugo"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "hugo@example.com", "password": "supersecreto123"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_with_wrong_password_is_rejected(client):
    client.post(
        "/api/auth/register",
        json={"email": "hugo@example.com", "password": "supersecreto123", "display_name": "Hugo"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "hugo@example.com", "password": "incorrecta"}
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "test@example.com"
