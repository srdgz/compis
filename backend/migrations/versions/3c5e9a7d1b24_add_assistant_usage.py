"""add assistant usage

Revision ID: 3c5e9a7d1b24
Revises: a8b8fc1a84a4
Create Date: 2026-11-03 10:12:41.208133

"""

import sqlalchemy as sa
from alembic import op

revision = "3c5e9a7d1b24"
down_revision = "a8b8fc1a84a4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "assistant_usage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("roomie_id", sa.Integer(), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["roomie_id"], ["roomies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("roomie_id", "day"),
    )
    with op.batch_alter_table("assistant_usage", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_assistant_usage_day"), ["day"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_assistant_usage_roomie_id"), ["roomie_id"], unique=False
        )


def downgrade():
    with op.batch_alter_table("assistant_usage", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_assistant_usage_roomie_id"))
        batch_op.drop_index(batch_op.f("ix_assistant_usage_day"))
    op.drop_table("assistant_usage")
