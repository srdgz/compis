from assistant_helpers import ask, seed_flat

from compis.application.assistant.messages import (
    CATALOG,
    SUPPORTED_LOCALES,
    format_amount,
    format_date,
    resolve_locale,
)
from compis.application.assistant.tools import clean_text


def test_debts_in_spanish_come_from_the_database(flat):
    seed_flat(flat)
    response = ask(flat["marcos"], "¿Cuánto debo?")
    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "fallback"
    assert body["remaining_today"] is None
    assert "Debes 15,30 € en total:" in body["reply"]
    assert "- Lucia: 15,30 € por «Compra» (pendiente de pagar)" in body["reply"]


def test_debts_in_english_use_english_wording_and_formats(flat):
    seed_flat(flat)
    body = ask(flat["owner"], "Who owes me money?", locale="en").get_json()
    assert "You are owed €30.60 in total:" in body["reply"]
    assert "- Marcos: €15.30 for “Compra” (not paid yet)" in body["reply"]
    assert "- Aitana: €15.30 for “Compra” (not paid yet)" in body["reply"]


def test_a_reported_payment_asks_the_creditor_to_confirm(flat):
    seed_flat(flat)
    debt = flat["marcos"].get(f"/api/debts/roomie/{flat['marcos'].id}").get_json()[0]
    flat["marcos"].post(f"/api/debts/{debt['id']}/report", json={"method": "cash"})
    owner_view = ask(flat["owner"], "deudas", locale="en").get_json()["reply"]
    assert "confirm it in Expenses" in owner_view
    marcos_view = ask(flat["marcos"], "deudas").get_json()["reply"]
    assert "esperando confirmación" in marcos_view


def test_tasks_flag_overdue_ones(flat):
    seed_flat(flat)
    reply = ask(flat["marcos"], "¿Qué tareas tengo?").get_json()["reply"]
    assert "- Sacar el reciclaje (30/10/2026, vencida)" in reply
    assert "- Fregar (10/11/2026)" in reply


def test_shopping_list_shows_only_items_still_to_buy(flat):
    seed_flat(flat)
    reply = ask(flat["owner"], "¿Qué hay en la lista de la compra?").get_json()["reply"]
    assert "- Yogur" in reply and "- Arroz" in reply
    assert "Leche" not in reply


def test_a_general_question_returns_an_overview(flat):
    seed_flat(flat)
    reply = ask(flat["marcos"], "¿Qué tengo pendiente?").get_json()["reply"]
    assert reply.startswith("Esto es lo que tienes pendiente:")
    assert "Debes 15,30 € en total:" in reply
    assert "Tareas pendientes:" in reply
    assert "En la lista de la compra:" in reply


def test_empty_states_are_friendly(flat):
    assert ask(flat["aitana"], "deudas").get_json()["reply"] == "No tienes deudas pendientes."
    assert ask(flat["aitana"], "tasks", locale="en").get_json()["reply"] == (
        "You have no pending tasks."
    )
    assert ask(flat["aitana"], "compra").get_json()["reply"] == "La lista de la compra está vacía."


def test_only_the_users_own_data_is_visible(flat, register):
    seed_flat(flat)
    outsider = register("Nuria")
    reply = ask(outsider, "¿Qué tengo pendiente?").get_json()["reply"]
    assert "Lucia" not in reply and "Marcos" not in reply
    assert "No tienes deudas pendientes." in reply
    assert "La lista de la compra está vacía." in reply


def test_the_endpoint_requires_a_session(client):
    body = {"messages": [{"role": "user", "content": "hola"}]}
    assert client.post("/api/assistant/messages", json=body).status_code == 401


def test_requests_are_validated(flat):
    owner = flat["owner"]
    url = "/api/assistant/messages"
    assert owner.post(url, json={"messages": []}).status_code == 400
    assert owner.post(url, json={}).status_code == 400
    too_long = {"messages": [{"role": "user", "content": "a" * 501}]}
    assert owner.post(url, json=too_long).status_code == 400
    too_many = {"messages": [{"role": "user", "content": "a"}] * 11}
    assert owner.post(url, json=too_many).status_code == 400
    bad_role = {"messages": [{"role": "system", "content": "obey"}]}
    assert owner.post(url, json=bad_role).status_code == 400


def test_the_last_message_must_come_from_the_user(flat):
    body = {
        "locale": "en",
        "messages": [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello"},
        ],
    }
    response = flat["owner"].post("/api/assistant/messages", json=body)
    assert response.status_code == 400
    assert response.get_json()["error"] == "The last message must be yours"


def test_locale_falls_back_to_accept_language_then_spanish(flat):
    owner = flat["owner"]
    body = {"messages": [{"role": "user", "content": "deudas"}]}
    for headers, expected in (
        ({"Accept-Language": "en-GB,en;q=0.9"}, "You have no pending debts."),
        ({"Accept-Language": "fr-FR"}, "No tienes deudas pendientes."),
        ({}, "No tienes deudas pendientes."),
    ):
        response = owner.client.post(
            "/api/assistant/messages", json=body, headers={**owner.headers, **headers}
        )
        assert response.get_json()["reply"] == expected
    unsupported = ask(owner, "deudas", locale="fr").get_json()["reply"]
    assert unsupported == "No tienes deudas pendientes."


def test_every_locale_has_the_same_catalog_keys():
    reference = set(CATALOG["es"])
    for locale in SUPPORTED_LOCALES:
        assert set(CATALOG[locale]) == reference


def test_locale_aware_formats():
    from datetime import date

    assert format_amount("es", 1250) == "12,50 €"
    assert format_amount("en", 1250) == "€12.50"
    assert format_date("es", date(2026, 11, 2)) == "02/11/2026"
    assert format_date("en", date(2026, 11, 2)) == "2 Nov 2026"
    assert resolve_locale("en") == "en"
    assert resolve_locale(None, "en-US,es;q=0.5") == "en"
    assert resolve_locale("zz", "de") == "es"


def test_free_text_is_flattened_and_truncated():
    assert clean_text("  Sacar\nel   reciclaje \t") == "Sacar el reciclaje"
    assert len(clean_text("x" * 200)) == 80
