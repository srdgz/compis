import click
from flask import Flask, current_app

from compis.application.container import Services

DEMO_PASSWORD = "compis-demo-2026"
DEMO_ROOMIES = (
    ("lucia@demo.compis.app", "Lucía"),
    ("marcos@demo.compis.app", "Marcos"),
    ("aitana@demo.compis.app", "Aitana"),
)


def seed_demo(services: Services) -> int:
    ids = []
    for email, first_name in DEMO_ROOMIES:
        roomie = services.auth.signup(email, DEMO_PASSWORD, first_name)
        assert roomie.id is not None
        ids.append(roomie.id)
    owner, *others = ids
    home, shopping_list = services.homes.create(owner, "Piso de Gràcia")
    assert home.id is not None and shopping_list.id is not None
    for email, _ in DEMO_ROOMIES[1:]:
        services.homes.add_roomie(owner, home.id, email)
    services.tasks.create(owner, ids[0], "Sacar la basura", "2026-11-03")
    services.tasks.create(owner, ids[1], "Limpiar el baño", "2026-11-05")
    services.tasks.create(owner, ids[2], "Regar las plantas", "2026-11-07")
    items = [
        services.shopping.add_item(owner, shopping_list.id, name)
        for name in ("Leche", "Pan", "Fruta", "Detergente")
    ]
    services.shopping.add_item(owner, shopping_list.id, "Papel de cocina")
    expense = services.expenses.create(
        owner, "Compra de la semana", [i.id for i in items[:3] if i.id is not None]
    )
    assert expense.id is not None
    services.debts.create_for_expense(owner, expense.id, others, 4590)
    return home.id


def register_cli(app: Flask) -> None:
    @app.cli.command("seed-demo")
    def seed_demo_command() -> None:
        home_id = seed_demo(current_app.extensions["compis"])
        click.echo(f"Demo home created with id {home_id}")

    @app.cli.command("send-digest")
    def send_digest_command() -> None:
        sent = current_app.extensions["compis"].digest.send_daily()
        click.echo(f"Digest sent to {sent} homes")
