from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from compis.domain.errors import DomainError


def register(app: Flask) -> None:
    @app.errorhandler(DomainError)
    def handle_domain_error(error: DomainError):
        return jsonify({"error": error.message}), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return jsonify({"error": error.description}), error.code

    @app.errorhandler(Exception)
    def handle_unexpected(error: Exception):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Error interno del servidor"}), 500

    jwt: JWTManager = app.extensions["flask-jwt-extended"]

    @jwt.unauthorized_loader
    def missing_token(reason: str):
        return jsonify({"error": "Inicia sesión para continuar"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason: str):
        return jsonify({"error": "La sesión no es válida"}), 401

    @jwt.expired_token_loader
    def expired_token(header: dict, payload: dict):
        return jsonify({"error": "La sesión ha caducado"}), 401
