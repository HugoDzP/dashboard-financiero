import uuid
from datetime import datetime, timezone

from app.extensions import db


class Transaction(db.Model):
    """Un movimiento de ingreso/gasto de finanzas personales."""

    __tablename__ = "transactions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)

    date = db.Column(db.Date, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(80), nullable=False, default="sin_categorizar")
    amount = db.Column(db.Numeric(12, 2), nullable=False)  # positivo=ingreso, negativo=gasto
    account = db.Column(db.String(120), nullable=True)
    source = db.Column(db.String(20), nullable=False, default="manual")  # manual | csv_import

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "category": self.category,
            "amount": float(self.amount),
            "account": self.account,
            "source": self.source,
        }
