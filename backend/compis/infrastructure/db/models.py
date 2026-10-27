from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class RoomieRow(Base):
    __tablename__ = "roomies"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    first_name: Mapped[str] = mapped_column(String(40))
    last_name: Mapped[str | None] = mapped_column(String(40))
    avatar: Mapped[str | None] = mapped_column(String(300))
    paypal_username: Mapped[str | None] = mapped_column(String(40))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    home_id: Mapped[int | None] = mapped_column(ForeignKey("homes.id"), index=True)


class HomeRow(Base):
    __tablename__ = "homes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    date_assigned: Mapped[date] = mapped_column(Date)
    date_done: Mapped[date | None] = mapped_column(Date)
    roomie_id: Mapped[int] = mapped_column(ForeignKey("roomies.id"), index=True)


class ShoppingListRow(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    home_id: Mapped[int] = mapped_column(ForeignKey("homes.id"), unique=True)


class ShoppingItemRow(Base):
    __tablename__ = "shopping_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    shopping_list_id: Mapped[int] = mapped_column(ForeignKey("shopping_lists.id"), index=True)
    expense_id: Mapped[int | None] = mapped_column(ForeignKey("expenses.id"))


class ExpenseRow(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    debt_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    home_id: Mapped[int] = mapped_column(ForeignKey("homes.id"), index=True)
    roomie_id: Mapped[int] = mapped_column(ForeignKey("roomies.id"), index=True)


class DebtRow(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    amount_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))
    date: Mapped[date] = mapped_column(Date)
    roomie_debtor_id: Mapped[int] = mapped_column(ForeignKey("roomies.id"), index=True)
    roomie_paying_id: Mapped[int] = mapped_column(ForeignKey("roomies.id"), index=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id"))


class FileRow(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(500))
    upload_date: Mapped[date] = mapped_column(Date)
    home_id: Mapped[int] = mapped_column(ForeignKey("homes.id"), index=True)
    expense_id: Mapped[int | None] = mapped_column(ForeignKey("expenses.id"))


class ActivityRow(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    home_id: Mapped[int] = mapped_column(ForeignKey("homes.id"), index=True)
    text: Mapped[str] = mapped_column(String(300))
    roomie_name: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20))
    amount_cents: Mapped[int | None] = mapped_column(Integer)
