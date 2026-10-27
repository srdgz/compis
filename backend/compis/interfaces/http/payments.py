from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import schemas
from compis.interfaces.http.deps import actor_id, parse_body, services

bp = Blueprint("payments", __name__)


@bp.post("/payments/paypal/orders")
@jwt_required()
def create_paypal_order():
    body = parse_body(schemas.PaypalOrderBody)
    order_id = services().paypal_demo.create_order(actor_id(), body.debt_id)
    return jsonify({"order_id": order_id}), 201


@bp.post("/payments/paypal/capture")
@jwt_required()
def capture_paypal_order():
    body = parse_body(schemas.PaypalCaptureBody)
    changed = services().paypal_demo.capture(actor_id(), body.debt_id, body.order_id)
    message = "Pago completado" if changed else "La deuda ya estaba saldada"
    return jsonify({"message": message})
