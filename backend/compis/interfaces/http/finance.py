from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.domain.money import to_cents
from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, flag, parse_body, services

bp = Blueprint("finance", __name__)


@bp.get("/expense/roomie/<int:roomie_id>")
@jwt_required()
def expenses_without_debts(roomie_id: int):
    expenses = services().expenses.list_without_debts(actor_id(), roomie_id)
    return jsonify([serializers.expense(e) for e in expenses])


@bp.post("/expense")
@jwt_required()
def create_expense():
    body = parse_body(schemas.ExpenseBody)
    expense = services().expenses.create(actor_id(), body.expense_name, body.item_ids)
    return jsonify({"message": "Gasto generado", "expense": serializers.expense(expense)}), 201


@bp.get("/debts/roomie/<int:roomie_id>")
@jwt_required()
def debts_by_roomie(roomie_id: int):
    debts = services().debts.list_for_roomie(actor_id(), roomie_id, flag("include_settled"))
    return jsonify([serializers.debt(d) for d in debts])


@bp.post("/debts")
@jwt_required()
def create_debts():
    body = parse_body(schemas.DebtBody)
    debts = services().debts.create_for_expense(
        actor_id(), body.expense_id, body.debtor_ids, to_cents(body.total_amount)
    )
    return (
        jsonify(
            {
                "message": "Deuda creada correctamente",
                "debts": [serializers.debt(d) for d in debts],
            }
        ),
        201,
    )


@bp.post("/debts/<int:debt_id>/report")
@jwt_required()
def report_payment(debt_id: int):
    body = parse_body(schemas.ReportPaymentBody)
    changed = services().debts.report_payment(actor_id(), debt_id, body.method)
    message = "Pago comunicado" if changed else "El pago ya estaba comunicado"
    return jsonify({"message": message})


@bp.post("/debts/<int:debt_id>/confirm")
@jwt_required()
def confirm_payment(debt_id: int):
    changed = services().debts.confirm_receipt(actor_id(), debt_id)
    message = "Pago confirmado" if changed else "La deuda ya estaba saldada"
    return jsonify({"message": message})


@bp.post("/debts/<int:debt_id>/reject")
@jwt_required()
def reject_payment(debt_id: int):
    services().debts.reject_payment(actor_id(), debt_id)
    return jsonify({"message": "Pago rechazado. La deuda vuelve a estar pendiente"})
