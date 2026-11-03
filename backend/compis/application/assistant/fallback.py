from datetime import date
from typing import Any

from compis.application.assistant.messages import format_amount, format_date, translate

DEBT_WORDS = (
    "deb",
    "deuda",
    "pag",
    "cobr",
    "dinero",
    "euro",
    "€",
    "cuenta",
    "owe",
    "debt",
    "pay",
    "money",
    "paid",
    "cash",
)
TASK_WORDS = ("tarea", "limpi", "task", "chore", "todo", "clean")
SHOPPING_WORDS = ("compra", "super", "lista", "shop", "grocer", "buy", "list")


def detect_areas(question: str) -> list[str]:
    text = question.lower()
    areas = []
    if any(word in text for word in SHOPPING_WORDS):
        areas.append("shopping")
    if any(word in text for word in TASK_WORDS):
        areas.append("tasks")
    if any(word in text for word in DEBT_WORDS) and "shopping" not in areas:
        areas.append("debts")
    return areas or ["debts", "tasks", "shopping"]


def render_debts(locale: str, data: dict[str, Any]) -> str:
    if not data["i_owe"] and not data["owed_to_me"]:
        return translate(locale, "debts.none")
    blocks = []
    if data["i_owe"]:
        lines = [
            translate(
                locale,
                "debts.owe.title",
                total=format_amount(locale, data["total_i_owe_cents"]),
            )
        ]
        for item in data["i_owe"]:
            key = (
                "debts.owe.waiting" if item["status"] == "waiting_confirmation" else "debts.owe.pay"
            )
            lines.append(
                translate(
                    locale,
                    key,
                    name=item["to"],
                    amount=format_amount(locale, item["amount_cents"]),
                    text=item["text"],
                )
            )
        blocks.append("\n".join(lines))
    if data["owed_to_me"]:
        lines = [
            translate(
                locale,
                "debts.owed.title",
                total=format_amount(locale, data["total_owed_to_me_cents"]),
            )
        ]
        for item in data["owed_to_me"]:
            key = (
                "debts.owed.confirm"
                if item["status"] == "waiting_confirmation"
                else "debts.owed.pending"
            )
            lines.append(
                translate(
                    locale,
                    key,
                    name=item["from"],
                    amount=format_amount(locale, item["amount_cents"]),
                    text=item["text"],
                )
            )
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def render_tasks(locale: str, data: dict[str, Any]) -> str:
    if not data["tasks"]:
        return translate(locale, "tasks.none")
    lines = [translate(locale, "tasks.title")]
    for task in data["tasks"]:
        key = "tasks.line_overdue" if task["overdue"] else "tasks.line"
        lines.append(
            translate(
                locale,
                key,
                text=task["text"],
                date=format_date(locale, date.fromisoformat(task["assigned"])),
            )
        )
    return "\n".join(lines)


def render_shopping(locale: str, data: dict[str, Any]) -> str:
    if not data["items"]:
        return translate(locale, "shopping.none")
    lines = [translate(locale, "shopping.title")]
    lines.extend(translate(locale, "shopping.line", text=text) for text in data["items"])
    return "\n".join(lines)


def overview_title(locale: str) -> str:
    return translate(locale, "overview.title")
