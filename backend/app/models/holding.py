import uuid
from datetime import datetime, timezone

from app.extensions import db


class Holding(db.Model):
    """Una posición de cartera: cuántas unidades de un ticker posee el usuario."""

    __tablename__ = "holdings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    ticker = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Numeric(18, 8), nullable=False)
    avg_cost = db.Column(db.Numeric(12, 4), nullable=False)  # coste medio por unidad
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ticker": self.ticker,
            "quantity": float(self.quantity),
            "avg_cost": float(self.avg_cost),
        }


class WatchlistItem(db.Model):
    """Ticker que el usuario sigue sin necesariamente poseerlo."""

    __tablename__ = "watchlist_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    ticker = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {"id": self.id, "ticker": self.ticker}
