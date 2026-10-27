from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token

from compis.interfaces.http import schemas
from compis.interfaces.http.deps import parse_body, services

bp = Blueprint("auth", __name__)


@bp.post("/signup")
def signup():
    body = parse_body(schemas.SignupBody)
    services().auth.signup(body.email, body.password, body.first_name, body.last_name, body.avatar)
    return jsonify({"message": "Nuevo roomie creado correctamente"}), 201


@bp.post("/login")
def login():
    body = parse_body(schemas.LoginBody)
    roomie = services().auth.login(body.email, body.password)
    token = create_access_token(identity=str(roomie.id))
    return jsonify(
        {
            "token": token,
            "roomie_id": roomie.id,
            "is_admin": roomie.is_admin,
            "home_id": roomie.home_id,
        }
    )


@bp.post("/logout")
def logout():
    return jsonify({"message": "El roomie ha salido correctamente"})
