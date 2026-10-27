from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from compis.interfaces.http import schemas, serializers
from compis.interfaces.http.deps import actor_id, flag, parse_body, services

bp = Blueprint("shopping", __name__)


@bp.get("/list/home/<int:home_id>")
@jwt_required()
def list_by_home(home_id: int):
    return jsonify(serializers.shopping_list(services().shopping.get_list(actor_id(), home_id)))


@bp.get("/item/list/<int:list_id>")
@jwt_required()
def items_by_list(list_id: int):
    items = services().shopping.list_items(actor_id(), list_id, flag("have_expense"))
    return jsonify([serializers.shopping_item(i) for i in items])


@bp.post("/item")
@jwt_required()
def create_item():
    body = parse_body(schemas.ItemBody)
    item = services().shopping.add_item(actor_id(), body.shopping_list_id, body.name)
    return jsonify(serializers.shopping_item(item)), 201


@bp.delete("/item/<int:item_id>")
@jwt_required()
def delete_item(item_id: int):
    services().shopping.delete_item(actor_id(), item_id)
    return jsonify({"message": "Elemento eliminado correctamente"})
