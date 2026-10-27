from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.domain.money import to_cents
from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, parse_body, services

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
    debts = services().debts.list_for_roomie(actor_id(), roomie_id)
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


@bp.post("/debts/<int:debt_id>")
@jwt_required()
def pay_debt(debt_id: int):
    changed = services().debts.mark_paid(actor_id(), debt_id)
    message = "Deuda pagada correctamente" if changed else "La deuda ya está pagada"
    return jsonify({"message": message})
