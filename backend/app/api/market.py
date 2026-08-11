import time

import yfinance as yf
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

bp = Blueprint("market", __name__, url_prefix="/api/market")

# Caché en memoria muy simple: {ticker: (timestamp, data)}
# Suficiente para un proyecto de portafolio; en producción esto iría a Redis.
_quote_cache: dict[str, tuple[float, dict]] = {}


def _get_cached_quote(ticker: str, ttl_seconds: int):
    cached = _quote_cache.get(ticker)
    if cached and (time.time() - cached[0]) < ttl_seconds:
        return cached[1]
    return None


@bp.get("/quote/<ticker>")
@jwt_required()
def quote(ticker):
    ticker = ticker.upper().strip()
    ttl = current_app.config["MARKET_QUOTE_CACHE_SECONDS"]

    cached = _get_cached_quote(ticker, ttl)
    if cached is not None:
        return jsonify(cached)

    try:
        t = yf.Ticker(ticker)
        info = t.fast_info
        data = {
            "ticker": ticker,
            "price": getattr(info, "last_price", None),
            "previous_close": getattr(info, "previous_close", None),
            "day_high": getattr(info, "day_high", None),
            "day_low": getattr(info, "day_low", None),
            "currency": getattr(info, "currency", None),
            "market_cap": getattr(info, "market_cap", None),
        }
        if data["price"] is None:
            return jsonify({"error": f"Ticker no encontrado: {ticker}"}), 404
    except Exception as exc:  # yfinance puede lanzar varios tipos de error de red/parseo
        return jsonify({"error": f"No se pudo obtener cotización de {ticker}: {exc}"}), 502

    _quote_cache[ticker] = (time.time(), data)
    return jsonify(data)


@bp.get("/history/<ticker>")
@jwt_required()
def history(ticker):
    ticker = ticker.upper().strip()
    period = request.args.get("period", "6mo")  # 1mo, 3mo, 6mo, 1y, 5y, max
    interval = request.args.get("interval", "1d")

    valid_periods = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
    if period not in valid_periods:
        return jsonify({"error": f"period debe ser uno de {sorted(valid_periods)}"}), 400

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval)
        if hist.empty:
            return jsonify({"error": f"Sin datos históricos para {ticker}"}), 404

        points = [
            {"date": idx.strftime("%Y-%m-%d"), "close": round(float(row["Close"]), 4)}
            for idx, row in hist.iterrows()
        ]
    except Exception as exc:
        return jsonify({"error": f"No se pudo obtener histórico de {ticker}: {exc}"}), 502

    return jsonify({"ticker": ticker, "period": period, "interval": interval, "points": points})
