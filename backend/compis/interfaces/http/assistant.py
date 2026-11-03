from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from compis.application.assistant.messages import resolve_locale
from compis.application.assistant.types import ChatMessage
from compis.interfaces.http import schemas
from compis.interfaces.http.deps import actor_id, parse_body, services

bp = Blueprint("assistant", __name__)


@bp.post("/assistant/messages")
@jwt_required()
def assistant_messages():
    body = parse_body(schemas.AssistantBody)
    locale = resolve_locale(body.locale, request.headers.get("Accept-Language"))
    messages = [ChatMessage(item.role, item.content) for item in body.messages]
    result = services().assistant.reply(actor_id(), messages, locale)
    return jsonify(
        {
            "reply": result.reply,
            "source": result.source,
            "remaining_today": result.remaining_today,
        }
    )
