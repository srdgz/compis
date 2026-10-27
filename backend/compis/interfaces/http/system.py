import hmac

from flask import Blueprint, jsonify, request

from compis.interfaces.http.deps import services

bp = Blueprint("system", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/config")
def public_config():
    client_id = services().paypal_demo_client_id
    return jsonify({"paypal_demo": {"enabled": client_id is not None, "client_id": client_id}})


@bp.get("/cron/digest")
def cron_digest():
    secret = services().cron_secret
    expected = f"Bearer {secret}"
    provided = request.headers.get("Authorization", "")
    if not secret or not hmac.compare_digest(provided, expected):
        return jsonify({"error": "No autorizado"}), 401
    return jsonify({"sent": services().digest.send_daily()})
