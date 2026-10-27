from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, parse_body, services

bp = Blueprint("files", __name__)


@bp.get("/file/home/<int:home_id>")
@jwt_required()
def files_by_home(home_id: int):
    files = services().files.list_by_home(actor_id(), home_id)
    return jsonify([serializers.file(f) for f in files])


@bp.post("/file")
@jwt_required()
def register_file():
    body = parse_body(schemas.FileBody)
    file = services().files.register(actor_id(), body.name, body.url, body.home_id, body.expense_id)
    return jsonify(serializers.file(file)), 201


@bp.delete("/file/<int:file_id>")
@jwt_required()
def delete_file(file_id: int):
    services().files.delete(actor_id(), file_id)
    return jsonify({"message": "Archivo eliminado correctamente"})
