import csv
import io
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Transaction

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

# Alias comunes de cabeceras de extractos bancarios -> nuestros campos
CSV_HEADER_ALIASES = {
    "date": {"date", "fecha", "fecha valor", "fecha operacion"},
    "description": {"description", "concepto", "descripcion", "detalle"},
    "amount": {"amount", "importe", "monto", "cantidad"},
}


def _find_column(fieldnames, target_key):
    normalized = {f.strip().lower(): f for f in fieldnames}
    for alias in CSV_HEADER_ALIASES[target_key]:
        if alias in normalized:
            return normalized[alias]
    return None


def _parse_date(raw: str):
    raw = raw.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Formato de fecha no reconocido: {raw}")


def _parse_amount(raw: str) -> float:
    raw = raw.strip().replace("€", "").replace(" ", "")
    # soporta formato europeo "1.234,56" y estándar "1234.56"
    if "," in raw and raw.count(",") == 1 and raw.rfind(",") > raw.rfind("."):
        raw = raw.replace(".", "").replace(",", ".")
    return float(raw)


@bp.get("")
@jwt_required()
def list_transactions():
    user_id = get_jwt_identity()
    query = Transaction.query.filter_by(user_id=user_id)

    category = request.args.get("category")
    if category:
        query = query.filter_by(category=category)

    date_from = request.args.get("from")
    date_to = request.args.get("to")
    if date_from:
        query = query.filter(Transaction.date >= _parse_date(date_from))
    if date_to:
        query = query.filter(Transaction.date <= _parse_date(date_to))

    transactions = query.order_by(Transaction.date.desc()).all()
    return jsonify([t.to_dict() for t in transactions])


@bp.post("")
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        tx = Transaction(
            user_id=user_id,
            date=_parse_date(data["date"]),
            description=data["description"].strip(),
            category=(data.get("category") or "sin_categorizar").strip(),
            amount=_parse_amount(str(data["amount"])),
            account=data.get("account"),
            source="manual",
        )
    except (KeyError, ValueError) as exc:
        return jsonify({"error": f"Datos inválidos: {exc}"}), 400

    db.session.add(tx)
    db.session.commit()
    return jsonify(tx.to_dict()), 201


@bp.patch("/<transaction_id>")
@jwt_required()
def update_transaction(transaction_id):
    """Permite recategorizar (u otros campos) una transacción existente.
    Pensado sobre todo para las importadas por CSV, que llegan como
    'sin_categorizar' porque el extracto bancario no trae esa información."""
    user_id = get_jwt_identity()
    tx = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first_or_404()
    data = request.get_json(silent=True) or {}

    if "category" in data:
        category = (data["category"] or "").strip()
        if not category:
            return jsonify({"error": "La categoría no puede quedar vacía"}), 400
        tx.category = category

    if "description" in data:
        description = (data["description"] or "").strip()
        if not description:
            return jsonify({"error": "La descripción no puede quedar vacía"}), 400
        tx.description = description

    if "date" in data:
        try:
            tx.date = _parse_date(data["date"])
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    if "amount" in data:
        try:
            tx.amount = _parse_amount(str(data["amount"]))
        except ValueError:
            return jsonify({"error": "Importe inválido"}), 400

    db.session.commit()
    return jsonify(tx.to_dict())


@bp.delete("/<transaction_id>")
@jwt_required()
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()
    tx = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first_or_404()
    db.session.delete(tx)
    db.session.commit()
    return "", 204


@bp.post("/import-csv")
@jwt_required()
def import_csv():
    """Importa un extracto bancario en CSV. Detecta columnas de fecha/concepto/importe
    por alias comunes en español e inglés."""
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400

    file = request.files["file"]
    raw_bytes = file.read()
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return jsonify({"error": "El CSV está vacío o no tiene cabecera"}), 400

    date_col = _find_column(reader.fieldnames, "date")
    desc_col = _find_column(reader.fieldnames, "description")
    amount_col = _find_column(reader.fieldnames, "amount")

    missing = [
        name
        for name, col in (("fecha", date_col), ("concepto", desc_col), ("importe", amount_col))
        if col is None
    ]
    if missing:
        return jsonify(
            {
                "error": f"No se pudieron detectar las columnas: {', '.join(missing)}. "
                f"Cabeceras encontradas: {reader.fieldnames}"
            }
        ), 400

    created, errors = 0, []
    for i, row in enumerate(reader, start=2):  # fila 1 es la cabecera
        try:
            tx = Transaction(
                user_id=user_id,
                date=_parse_date(row[date_col]),
                description=(row[desc_col] or "").strip() or "(sin descripción)",
                amount=_parse_amount(row[amount_col]),
                source="csv_import",
            )
            db.session.add(tx)
            created += 1
        except (ValueError, KeyError) as exc:
            errors.append(f"Fila {i}: {exc}")

    db.session.commit()
    return jsonify({"imported": created, "errors": errors}), 201
