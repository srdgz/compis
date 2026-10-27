"""initial schema

Revision ID: d7b4f2d29467
Revises:
Create Date: 2026-10-27 13:14:39.238234

"""

import sqlalchemy as sa
from alembic import op

revision = "d7b4f2d29467"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "homes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("home_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=300), nullable=False),
        sa.Column("roomie_name", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["home_id"],
            ["homes.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("activities", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_activities_created_at"), ["created_at"], unique=False)
        batch_op.create_index(batch_op.f("ix_activities_home_id"), ["home_id"], unique=False)

    op.create_table(
        "roomies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=128), nullable=False),
        sa.Column("first_name", sa.String(length=40), nullable=False),
        sa.Column("last_name", sa.String(length=40), nullable=True),
        sa.Column("avatar", sa.String(length=300), nullable=True),
        sa.Column("paypal_username", sa.String(length=40), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("home_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["home_id"],
            ["homes.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    with op.batch_alter_table("roomies", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_roomies_home_id"), ["home_id"], unique=False)

    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("home_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["home_id"],
            ["homes.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("home_id"),
    )
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("debt_generated", sa.Boolean(), nullable=False),
        sa.Column("home_id", sa.Integer(), nullable=False),
        sa.Column("roomie_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["home_id"],
            ["homes.id"],
        ),
        sa.ForeignKeyConstraint(
            ["roomie_id"],
            ["roomies.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("expenses", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_expenses_home_id"), ["home_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_expenses_roomie_id"), ["roomie_id"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("date_assigned", sa.Date(), nullable=False),
        sa.Column("date_done", sa.Date(), nullable=True),
        sa.Column("roomie_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["roomie_id"],
            ["roomies.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_tasks_roomie_id"), ["roomie_id"], unique=False)

    op.create_table(
        "debts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("roomie_debtor_id", sa.Integer(), nullable=False),
        sa.Column("roomie_paying_id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["expense_id"],
            ["expenses.id"],
        ),
        sa.ForeignKeyConstraint(
            ["roomie_debtor_id"],
            ["roomies.id"],
        ),
        sa.ForeignKeyConstraint(
            ["roomie_paying_id"],
            ["roomies.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("debts", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_debts_roomie_debtor_id"), ["roomie_debtor_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_debts_roomie_paying_id"), ["roomie_paying_id"], unique=False
        )

    op.create_table(
        "files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("upload_date", sa.Date(), nullable=False),
        sa.Column("home_id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["expense_id"],
            ["expenses.id"],
        ),
        sa.ForeignKeyConstraint(
            ["home_id"],
            ["homes.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_files_home_id"), ["home_id"], unique=False)

    op.create_table(
        "shopping_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("shopping_list_id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["expense_id"],
            ["expenses.id"],
        ),
        sa.ForeignKeyConstraint(
            ["shopping_list_id"],
            ["shopping_lists.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("shopping_items", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_shopping_items_shopping_list_id"), ["shopping_list_id"], unique=False
        )


def downgrade():
    with op.batch_alter_table("shopping_items", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_shopping_items_shopping_list_id"))

    op.drop_table("shopping_items")
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_files_home_id"))

    op.drop_table("files")
    with op.batch_alter_table("debts", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_debts_roomie_paying_id"))
        batch_op.drop_index(batch_op.f("ix_debts_roomie_debtor_id"))

    op.drop_table("debts")
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_tasks_roomie_id"))

    op.drop_table("tasks")
    with op.batch_alter_table("expenses", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_expenses_roomie_id"))
        batch_op.drop_index(batch_op.f("ix_expenses_home_id"))

    op.drop_table("expenses")
    op.drop_table("shopping_lists")
    with op.batch_alter_table("roomies", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_roomies_home_id"))

    op.drop_table("roomies")
    with op.batch_alter_table("activities", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_activities_home_id"))
        batch_op.drop_index(batch_op.f("ix_activities_created_at"))

    op.drop_table("activities")
    op.drop_table("homes")
