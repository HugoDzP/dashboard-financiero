import io


def test_create_and_list_transaction(client, auth_headers):
    resp = client.post(
        "/api/transactions",
        json={"date": "2026-08-01", "description": "Nómina", "amount": 1500, "category": "nómina"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    resp = client.get("/api/transactions", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_create_transaction_requires_auth(client):
    resp = client.post(
        "/api/transactions", json={"date": "2026-08-01", "description": "x", "amount": 1}
    )
    assert resp.status_code == 401


def test_delete_transaction(client, auth_headers):
    resp = client.post(
        "/api/transactions",
        json={"date": "2026-08-01", "description": "Gasolinera", "amount": -60},
        headers=auth_headers,
    )
    tx_id = resp.get_json()["id"]

    resp = client.delete(f"/api/transactions/{tx_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = client.get("/api/transactions", headers=auth_headers)
    assert resp.get_json() == []


def test_update_transaction_category(client, auth_headers):
    resp = client.post(
        "/api/transactions",
        json={
            "date": "2026-08-01",
            "description": "Mercadona",
            "amount": -45.30,
            "category": "sin_categorizar",
        },
        headers=auth_headers,
    )
    tx_id = resp.get_json()["id"]

    resp = client.patch(
        f"/api/transactions/{tx_id}", json={"category": "alimentación"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.get_json()["category"] == "alimentación"


def test_update_transaction_rejects_empty_category(client, auth_headers):
    resp = client.post(
        "/api/transactions",
        json={"date": "2026-08-01", "description": "x", "amount": -10},
        headers=auth_headers,
    )
    tx_id = resp.get_json()["id"]

    resp = client.patch(f"/api/transactions/{tx_id}", json={"category": "  "}, headers=auth_headers)
    assert resp.status_code == 400


def test_import_csv_detects_spanish_headers_and_european_amount_format(client, auth_headers):
    csv_content = (
        "Fecha,Concepto,Importe\n"
        "2026-08-05,Gasolinera,-60.00\n"
        '2026-08-06,Transferencia recibida,"1.234,56"\n'
    )
    resp = client.post(
        "/api/transactions/import-csv",
        data={"file": (io.BytesIO(csv_content.encode()), "extracto.csv")},
        headers=auth_headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["imported"] == 2
    assert body["errors"] == []

    resp = client.get("/api/transactions", headers=auth_headers)
    amounts = sorted(t["amount"] for t in resp.get_json())
    assert amounts == [-60.0, 1234.56]


def test_import_csv_rejects_unrecognized_columns(client, auth_headers):
    csv_content = "colA,colB\n1,2\n"
    resp = client.post(
        "/api/transactions/import-csv",
        data={"file": (io.BytesIO(csv_content.encode()), "extracto.csv")},
        headers=auth_headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_user_cannot_see_another_users_transactions(client, app):
    client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "password": "supersecreto123", "display_name": "A"},
    )
    token_a = client.post(
        "/api/auth/login", json={"email": "a@example.com", "password": "supersecreto123"}
    ).get_json()["access_token"]
    client.post(
        "/api/transactions",
        json={"date": "2026-08-01", "description": "Solo de A", "amount": -10},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    client.post(
        "/api/auth/register",
        json={"email": "b@example.com", "password": "supersecreto123", "display_name": "B"},
    )
    token_b = client.post(
        "/api/auth/login", json={"email": "b@example.com", "password": "supersecreto123"}
    ).get_json()["access_token"]

    resp = client.get("/api/transactions", headers={"Authorization": f"Bearer {token_b}"})
    assert resp.get_json() == []
