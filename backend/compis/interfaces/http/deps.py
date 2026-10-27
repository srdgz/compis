from flask import current_app, request
from flask_jwt_extended import get_jwt_identity
from pydantic import BaseModel
from pydantic import ValidationError as PydanticValidationError

from compis.application.container import Services
from compis.domain.errors import ValidationError


def services() -> Services:
    return current_app.extensions["compis"]


def actor_id() -> int:
    return int(get_jwt_identity())


def json_body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError("Faltan campos por completar")
    return data


def parse_body[M: BaseModel](model: type[M]) -> M:
    try:
        return model.model_validate(json_body())
    except PydanticValidationError as error:
        fields = sorted({str(e["loc"][0]) for e in error.errors() if e["loc"]})
        detail = f": {', '.join(fields)}" if fields else ""
        raise ValidationError(f"Faltan campos por completar o no son válidos{detail}") from error


def flag(name: str) -> bool:
    return request.args.get(name, "").lower() in {"1", "true", "yes"}
