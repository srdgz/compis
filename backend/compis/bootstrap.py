from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

from compis.application.container import build_services
from compis.application.ports import Clock, Mailer, PaymentGateway
from compis.config import Settings
from compis.domain.avatar import media_prefix
from compis.infrastructure.adapters import (
    BcryptPasswordHasher,
    FlaskMailMailer,
    NullMailer,
    SystemClock,
)
from compis.infrastructure.db.extensions import db, migrate
from compis.infrastructure.paypal import PayPalSandboxGateway
from compis.infrastructure.unit_of_work import SqlUnitOfWork
from compis.interfaces.cli import register_cli
from compis.interfaces.http import register_http


def create_app(
    settings: Settings | None = None,
    clock: Clock | None = None,
    mailer: Mailer | None = None,
    gateway: PaymentGateway | None = None,
) -> Flask:
    settings = settings or Settings.from_env()
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True, "pool_recycle": 280}
    app.config["JWT_SECRET_KEY"] = settings.jwt_secret_key
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = settings.jwt_expires_hours * 3600
    app.config["TESTING"] = settings.testing
    app.config.update(
        MAIL_SERVER=settings.mail_server,
        MAIL_PORT=settings.mail_port,
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_USE_TLS=settings.mail_use_tls,
        MAIL_USE_SSL=settings.mail_use_ssl,
    )

    db.init_app(app)
    migrate.init_app(app, db, directory="migrations", compare_type=True)
    JWTManager(app)
    CORS(app, origins=list(settings.cors_origins))

    if mailer is None:
        mailer = (
            FlaskMailMailer(Mail(app), settings.mail_sender)
            if settings.mail_server
            else NullMailer()
        )
    if gateway is None and settings.paypal_demo_client_id and settings.paypal_demo_client_secret:
        gateway = PayPalSandboxGateway(
            settings.paypal_demo_client_id, settings.paypal_demo_client_secret
        )
    app.extensions["compis"] = build_services(
        SqlUnitOfWork(db.session),
        clock or SystemClock(),
        BcryptPasswordHasher(),
        mailer,
        settings.cron_secret,
        gateway,
        settings.paypal_demo_client_id,
        media_prefix(settings.cloudinary_cloud_name),
    )
    register_http(app)
    register_cli(app)
    return app
