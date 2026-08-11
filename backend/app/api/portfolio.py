from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Holding, WatchlistItem

bp = Blueprint("portfolio", __name__, url_prefix="/api/portfolio")


@bp.get("/holdings")
@jwt_required()
def list_holdings():
    user_id = get_jwt_identity()
    holdings = Holding.query.filter_by(user_id=user_id).all()
    return jsonify([h.to_dict() for h in holdings])


@bp.post("/holdings")
@jwt_required()
def create_holding():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        holding = Holding(
            user_id=user_id,
            ticker=data["ticker"].upper().strip(),
            quantity=float(data["quantity"]),
            avg_cost=float(data["avg_cost"]),
        )
    except (KeyError, ValueError) as exc:
        return jsonify({"error": f"Datos inválidos: {exc}"}), 400

    db.session.add(holding)
    db.session.commit()
    return jsonify(holding.to_dict()), 201


@bp.delete("/holdings/<holding_id>")
@jwt_required()
def delete_holding(holding_id):
    user_id = get_jwt_identity()
    holding = Holding.query.filter_by(id=holding_id, user_id=user_id).first_or_404()
    db.session.delete(holding)
    db.session.commit()
    return "", 204


@bp.get("/watchlist")
@jwt_required()
def list_watchlist():
    user_id = get_jwt_identity()
    items = WatchlistItem.query.filter_by(user_id=user_id).all()
    return jsonify([w.to_dict() for w in items])


@bp.post("/watchlist")
@jwt_required()
def add_watchlist_item():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    ticker = (data.get("ticker") or "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker es obligatorio"}), 400

    item = WatchlistItem(user_id=user_id, ticker=ticker)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.delete("/watchlist/<item_id>")
@jwt_required()
def remove_watchlist_item(item_id):
    user_id = get_jwt_identity()
    item = WatchlistItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return "", 204
