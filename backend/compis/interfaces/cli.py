from datetime import date, timedelta

import click
from flask import Flask, current_app
from sqlalchemy import delete, or_, select, update

from compis.application.container import Services
from compis.infrastructure.db.extensions import db
from compis.infrastructure.db.models import (
    ActivityRow,
    DebtRow,
    ExpenseRow,
    FileRow,
    HomeRow,
    RoomieRow,
    ShoppingItemRow,
    ShoppingListRow,
    TaskRow,
)

DEMO_PASSWORD = "compis-demo-2026"
DEMO_DOMAIN = "@demo.compis.app"
DEMO_ROOMIES = (
    (f"lucia{DEMO_DOMAIN}", "Lucía"),
    (f"marcos{DEMO_DOMAIN}", "Marcos"),
    (f"aitana{DEMO_DOMAIN}", "Aitana"),
)


def seed_demo(services: Services) -> int:
    ids = []
    for email, first_name in DEMO_ROOMIES:
        roomie = services.auth.signup(email, DEMO_PASSWORD, first_name)
        assert roomie.id is not None
        ids.append(roomie.id)
    lucia, marcos, aitana = ids
    home, shopping_list = services.homes.create(lucia, "Piso de Gràcia")
    assert home.id is not None and shopping_list.id is not None
    for email, _ in DEMO_ROOMIES[1:]:
        services.homes.add_roomie(lucia, home.id, email)

    today = date.today()

    def day(offset: int) -> str:
        return (today + timedelta(days=offset)).isoformat()

    services.tasks.create(lucia, lucia, "Pagar el recibo del agua", day(-1))
    services.tasks.create(lucia, lucia, "Sacar la basura", day(0))
    services.tasks.create(lucia, marcos, "Limpiar el baño", day(1))
    services.tasks.create(lucia, aitana, "Regar las plantas", day(3))

    groceries = [
        services.shopping.add_item(lucia, shopping_list.id, name)
        for name in ("Leche", "Pan", "Fruta", "Detergente")
    ]
    services.shopping.add_item(lucia, shopping_list.id, "Papel de cocina")
    groceries_expense = services.expenses.create(
        lucia, "Compra de la semana", [i.id for i in groceries[:3] if i.id is not None]
    )
    assert groceries_expense.id is not None
    services.debts.create_for_expense(lucia, groceries_expense.id, [marcos, aitana], 4590)

    dinner = [
        services.shopping.add_item(marcos, shopping_list.id, name) for name in ("Pizzas", "Bebidas")
    ]
    dinner_expense = services.expenses.create(
        marcos, "Cena del viernes", [i.id for i in dinner if i.id is not None]
    )
    assert dinner_expense.id is not None
    services.debts.create_for_expense(marcos, dinner_expense.id, [lucia, aitana], 4200)
    return home.id


def reset_demo(session) -> None:
    demo = RoomieRow.email.like(f"%{DEMO_DOMAIN}")
    roomie_ids = select(RoomieRow.id).where(demo)
    home_ids = select(RoomieRow.home_id).where(demo, RoomieRow.home_id.is_not(None))
    list_ids = select(ShoppingListRow.id).where(ShoppingListRow.home_id.in_(home_ids))

    session.execute(delete(ActivityRow).where(ActivityRow.home_id.in_(home_ids)))
    session.execute(delete(FileRow).where(FileRow.home_id.in_(home_ids)))
    session.execute(
        delete(DebtRow).where(
            or_(DebtRow.roomie_debtor_id.in_(roomie_ids), DebtRow.roomie_paying_id.in_(roomie_ids))
        )
    )
    session.execute(delete(ShoppingItemRow).where(ShoppingItemRow.shopping_list_id.in_(list_ids)))
    session.execute(delete(ExpenseRow).where(ExpenseRow.home_id.in_(home_ids)))
    session.execute(delete(TaskRow).where(TaskRow.roomie_id.in_(roomie_ids)))
    session.execute(delete(ShoppingListRow).where(ShoppingListRow.home_id.in_(home_ids)))
    stale_homes = [row for (row,) in session.execute(home_ids).all()]
    session.execute(update(RoomieRow).where(demo).values(home_id=None))
    if stale_homes:
        session.execute(delete(HomeRow).where(HomeRow.id.in_(stale_homes)))
    session.execute(delete(RoomieRow).where(demo))
    session.commit()


def register_cli(app: Flask) -> None:
    @app.cli.command("seed-demo")
    def seed_demo_command() -> None:
        home_id = seed_demo(current_app.extensions["compis"])
        click.echo(f"Demo home created with id {home_id}")

    @app.cli.command("reset-demo")
    def reset_demo_command() -> None:
        reset_demo(db.session)
        home_id = seed_demo(current_app.extensions["compis"])
        click.echo(f"Demo data recreated with home id {home_id}")

    @app.cli.command("send-digest")
    def send_digest_command() -> None:
        sent = current_app.extensions["compis"].digest.send_daily()
        click.echo(f"Digest sent to {sent} homes")
