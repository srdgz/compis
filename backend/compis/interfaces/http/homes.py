from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, parse_body, services

bp = Blueprint("homes", __name__)


@bp.get("/home/<int:home_id>")
@jwt_required()
def get_home(home_id: int):
    return jsonify(serializers.home(services().homes.get(actor_id(), home_id)))


@bp.post("/home")
@jwt_required()
def create_home():
    body = parse_body(schemas.HomeBody)
    home, shopping_list = services().homes.create(actor_id(), body.name)
    return (
        jsonify(
            {
                "message": "Vivienda creada correctamente",
                "home_id": home.id,
                "roomie_id": actor_id(),
                "is_admin": True,
                "shopping_list_id": shopping_list.id,
                "shopping_list_name": shopping_list.name,
            }
        ),
        201,
    )


@bp.post("/home/<int:home_id>")
@jwt_required()
def add_roomie(home_id: int):
    body = parse_body(schemas.AddRoomieBody)
    services().homes.add_roomie(actor_id(), home_id, body.email)
    return jsonify({"message": "Compi agregado a la vivienda correctamente"})


@bp.delete("/home/<int:home_id>/<int:roomie_id>")
@jwt_required()
def remove_roomie(home_id: int, roomie_id: int):
    services().homes.remove_roomie(actor_id(), home_id, roomie_id)
    return jsonify({"message": "Compi eliminado de la vivienda correctamente"})


@bp.put("/home/<int:home_id>")
@jwt_required()
def deactivate_home(home_id: int):
    return jsonify(serializers.home(services().homes.deactivate(actor_id(), home_id)))
