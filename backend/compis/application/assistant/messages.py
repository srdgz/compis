from datetime import date

SUPPORTED_LOCALES = ("es", "en")
DEFAULT_LOCALE = "es"

CATALOG: dict[str, dict[str, str]] = {
    "es": {
        "overview.title": "Esto es lo que tienes pendiente:",
        "debts.none": "No tienes deudas pendientes.",
        "debts.owe.title": "Debes {total} en total:",
        "debts.owe.pay": "- {name}: {amount} por «{text}» (pendiente de pagar)",
        "debts.owe.waiting": (
            "- {name}: {amount} por «{text}» (pago avisado, esperando confirmación)"
        ),
        "debts.owed.title": "Te deben {total} en total:",
        "debts.owed.pending": "- {name}: {amount} por «{text}» (aún no ha pagado)",
        "debts.owed.confirm": (
            "- {name}: {amount} por «{text}» (ha avisado de que ha pagado, confírmalo en Gastos)"
        ),
        "tasks.none": "No tienes tareas pendientes.",
        "tasks.title": "Tareas pendientes:",
        "tasks.line": "- {text} ({date})",
        "tasks.line_overdue": "- {text} ({date}, vencida)",
        "shopping.none": "La lista de la compra está vacía.",
        "shopping.title": "En la lista de la compra:",
        "shopping.line": "- {text}",
        "limit.reached": "Has llegado al límite de preguntas de hoy. Vuelve a intentarlo mañana.",
        "request.last_must_be_user": "El último mensaje debe ser tuyo",
    },
    "en": {
        "overview.title": "Here is what you have pending:",
        "debts.none": "You have no pending debts.",
        "debts.owe.title": "You owe {total} in total:",
        "debts.owe.pay": "- {name}: {amount} for “{text}” (still to pay)",
        "debts.owe.waiting": (
            "- {name}: {amount} for “{text}” (payment reported, waiting for confirmation)"
        ),
        "debts.owed.title": "You are owed {total} in total:",
        "debts.owed.pending": "- {name}: {amount} for “{text}” (not paid yet)",
        "debts.owed.confirm": (
            "- {name}: {amount} for “{text}” (they say they paid, confirm it in Expenses)"
        ),
        "tasks.none": "You have no pending tasks.",
        "tasks.title": "Pending tasks:",
        "tasks.line": "- {text} ({date})",
        "tasks.line_overdue": "- {text} ({date}, overdue)",
        "shopping.none": "The shopping list is empty.",
        "shopping.title": "On the shopping list:",
        "shopping.line": "- {text}",
        "limit.reached": "You have reached today's question limit. Please try again tomorrow.",
        "request.last_must_be_user": "The last message must be yours",
    },
}

MONTHS_EN = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def translate(locale: str, key: str, **values: str) -> str:
    template = CATALOG.get(locale, CATALOG[DEFAULT_LOCALE])[key]
    return template.format(**values)


def resolve_locale(requested: str | None, accept_language: str | None = None) -> str:
    if requested in SUPPORTED_LOCALES:
        return str(requested)
    for part in (accept_language or "").split(","):
        primary = part.split(";")[0].strip().lower().split("-")[0]
        if primary in SUPPORTED_LOCALES:
            return primary
    return DEFAULT_LOCALE


def format_amount(locale: str, cents: int) -> str:
    number = f"{cents / 100:.2f}"
    if locale == "en":
        return f"€{number}"
    return f"{number.replace('.', ',')} €"


def format_date(locale: str, value: date) -> str:
    if locale == "en":
        return f"{value.day} {MONTHS_EN[value.month - 1]} {value.year}"
    return f"{value.day:02d}/{value.month:02d}/{value.year}"
