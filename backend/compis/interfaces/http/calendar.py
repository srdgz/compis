from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import serializers
from compis.interfaces.http.deps import actor_id, services

bp = Blueprint("calendar", __name__)


@bp.get("/calendar/<int:roomie_id>")
@jwt_required()
def calendar_events(roomie_id: int):
    events = services().calendar.events_for(actor_id(), roomie_id)
    return jsonify([serializers.calendar_event(e) for e in events])
