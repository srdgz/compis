from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.domain.errors import ValidationError
from compis.interfaces.http import serializers
from compis.interfaces.http.deps import actor_id, json_body, services

bp = Blueprint("roomies", __name__)

EDITABLE_FIELDS = ("first_name", "last_name", "avatar", "paypal_username", "password")


@bp.get("/roomie/<int:roomie_id>")
@jwt_required()
def get_roomie(roomie_id: int):
    return jsonify(serializers.roomie(services().roomies.get(actor_id(), roomie_id)))


@bp.get("/roomie/home/<int:home_id>")
@jwt_required()
def list_home_roomies(home_id: int):
    roomies = services().roomies.list_by_home(actor_id(), home_id)
    return jsonify([serializers.roomie(r) for r in roomies])


@bp.put("/roomie/<int:roomie_id>")
@jwt_required()
def update_roomie(roomie_id: int):
    data = json_body()
    if "email" in data:
        raise ValidationError("No puedes actualizar el email")
    changes = {key: data[key] for key in EDITABLE_FIELDS if key in data}
    roomie = services().roomies.update_profile(actor_id(), roomie_id, **changes)
    return jsonify(serializers.roomie(roomie))


@bp.put("/roomie/delete/<int:roomie_id>")
@jwt_required()
def deactivate_roomie(roomie_id: int):
    return jsonify(serializers.roomie(services().roomies.deactivate(actor_id(), roomie_id)))
