from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, flag, parse_body, services

bp = Blueprint("tasks", __name__)


@bp.get("/task/roomie/<int:roomie_id>")
@jwt_required()
def tasks_by_roomie(roomie_id: int):
    tasks = services().tasks.list_for_roomie(actor_id(), roomie_id, flag("only_pending_tasks"))
    return jsonify([serializers.task(t) for t in tasks])


@bp.get("/task/home/<int:home_id>")
@jwt_required()
def tasks_by_home(home_id: int):
    pairs = services().tasks.list_for_home(actor_id(), home_id, flag("only_pending_tasks"))
    return jsonify([serializers.task(t, assignee) for t, assignee in pairs])


@bp.post("/task")
@jwt_required()
def create_task():
    body = parse_body(schemas.TaskBody)
    task = services().tasks.create(actor_id(), body.roomie_id, body.name, body.date_assigned)
    return jsonify(serializers.task(task)), 201


@bp.put("/task/<int:task_id>")
@jwt_required()
def complete_task(task_id: int):
    changed = services().tasks.complete(actor_id(), task_id)
    message = "Tarea completada" if changed else "La tarea ya está marcada como completada"
    return jsonify({"message": message})


@bp.put("/task/date/<int:task_id>")
@jwt_required()
def reschedule_task(task_id: int):
    body = parse_body(schemas.TaskDateBody)
    task = services().tasks.reschedule(actor_id(), task_id, body.new_date_assigned)
    return jsonify(serializers.task(task))


@bp.delete("/task/<int:task_id>")
@jwt_required()
def delete_task(task_id: int):
    services().tasks.delete(actor_id(), task_id)
    return jsonify({"message": "Tarea eliminada correctamente"})
