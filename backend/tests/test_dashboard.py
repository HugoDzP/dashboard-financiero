def test_dashboard_summary_aggregates_income_and_expenses(client, auth_headers):
    client.post(
        "/api/transactions",
        json={"date": "2026-08-01", "description": "Nómina", "amount": 1500, "category": "nómina"},
        headers=auth_headers,
    )
    client.post(
        "/api/transactions",
        json={
            "date": "2026-08-03",
            "description": "Mercadona",
            "amount": -45.30,
            "category": "alimentación",
        },
        headers=auth_headers,
    )

    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    finance = resp.get_json()["personal_finance"]
    assert finance["income"] == 1500
    assert finance["expenses"] == -45.30
    assert round(finance["net"], 2) == 1454.70
    assert finance["spending_by_category"] == [{"category": "alimentación", "amount": 45.30}]


def test_dashboard_summary_with_no_data_returns_zeros(client, auth_headers):
    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    finance = resp.get_json()["personal_finance"]
    assert finance["income"] == 0
    assert finance["expenses"] == 0
    assert finance["net"] == 0
    assert resp.get_json()["portfolio"]["allocation"] == []
