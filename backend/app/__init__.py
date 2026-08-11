import os

from flask import Flask

from app.config import config_by_name
from app.extensions import db, migrate, jwt, cors, limiter


def create_app(config_name: str | None = None) -> Flask:
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    limiter.init_app(app)

    from app.auth.routes import bp as auth_bp
    from app.api.transactions import bp as transactions_bp
    from app.api.market import bp as market_bp
    from app.api.portfolio import bp as portfolio_bp
    from app.api.dashboard import bp as dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
