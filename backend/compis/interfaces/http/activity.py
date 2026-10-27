from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import serializers
from compis.interfaces.http.deps import actor_id, services

bp = Blueprint("activity", __name__)


@bp.get("/blog/home/<int:home_id>")
@jwt_required()
def activity_by_home(home_id: int):
    items = services().activity.list_for_home(actor_id(), home_id)
    return jsonify([serializers.activity(a) for a in items])
