from typing import Literal

from pydantic import BaseModel


class SignupBody(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str | None = None
    avatar: str | None = None


class LoginBody(BaseModel):
    email: str
    password: str


class HomeBody(BaseModel):
    name: str


class AddRoomieBody(BaseModel):
    email: str


class TaskBody(BaseModel):
    roomie_id: int
    name: str
    date_assigned: str


class TaskDateBody(BaseModel):
    new_date_assigned: str


class ItemBody(BaseModel):
    name: str
    shopping_list_id: int


class ExpenseBody(BaseModel):
    expense_name: str
    item_ids: list[int]


class DebtBody(BaseModel):
    expense_id: int
    debtor_ids: list[int]
    total_amount: float


class FileBody(BaseModel):
    name: str
    url: str
    home_id: int
    expense_id: int | None = None


class ReportPaymentBody(BaseModel):
    method: Literal["cash", "paypal_me"]


class PaypalOrderBody(BaseModel):
    debt_id: int


class PaypalCaptureBody(BaseModel):
    debt_id: int
    order_id: str
