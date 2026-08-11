from collections import defaultdict

import yfinance as yf
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import Transaction, Holding

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("/summary")
@jwt_required()
def summary():
    user_id = get_jwt_identity()

    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date).all()
    income = sum(float(t.amount) for t in transactions if t.amount > 0)
    expenses = sum(float(t.amount) for t in transactions if t.amount < 0)

    spending_by_category = defaultdict(float)
    for t in transactions:
        if t.amount < 0:
            spending_by_category[t.category] += float(-t.amount)

    # balance acumulado día a día, para gráfica de evolución
    balance_over_time = []
    running = 0.0
    for t in transactions:
        running += float(t.amount)
        balance_over_time.append({"date": t.date.isoformat(), "balance": round(running, 2)})

    holdings = Holding.query.filter_by(user_id=user_id).all()
    portfolio_value, portfolio_cost, allocation = 0.0, 0.0, []
    for h in holdings:
        try:
            price = yf.Ticker(h.ticker).fast_info.last_price or 0.0
        except Exception:
            price = 0.0
        value = price * float(h.quantity)
        cost = float(h.avg_cost) * float(h.quantity)
        portfolio_value += value
        portfolio_cost += cost
        allocation.append(
            {
                "ticker": h.ticker,
                "quantity": float(h.quantity),
                "current_price": price,
                "value": round(value, 2),
                "cost_basis": round(cost, 2),
                "gain_loss": round(value - cost, 2),
            }
        )

    return jsonify(
        {
            "personal_finance": {
                "income": round(income, 2),
                "expenses": round(expenses, 2),
                "net": round(income + expenses, 2),
                "spending_by_category": [
                    {"category": k, "amount": round(v, 2)}
                    for k, v in sorted(spending_by_category.items(), key=lambda kv: -kv[1])
                ],
                "balance_over_time": balance_over_time,
            },
            "portfolio": {
                "total_value": round(portfolio_value, 2),
                "total_cost": round(portfolio_cost, 2),
                "total_gain_loss": round(portfolio_value - portfolio_cost, 2),
                "allocation": allocation,
            },
        }
    )
