from datetime import timedelta

from compis.infrastructure.db.extensions import db
from compis.infrastructure.db.models import HomeRow, RoomieRow
from compis.interfaces.cli import DEMO_PASSWORD, reset_demo, seed_demo


def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}


def test_cron_digest_requires_the_secret(client):
    assert client.get("/api/cron/digest").status_code == 401
    wrong = client.get("/api/cron/digest", headers={"Authorization": "Bearer nope"})
    assert wrong.status_code == 401


def test_digest_emails_only_homes_with_recent_activity(flat, client, clock, mailer):
    headers = {"Authorization": "Bearer cron-secret"}
    sent = client.get("/api/cron/digest", headers=headers).get_json()["sent"]
    assert sent == 1
    assert len(mailer.sent) == 1
    assert sorted(mailer.sent[0][1]) == [
        "aitana@example.com",
        "lucia@example.com",
        "marcos@example.com",
    ]

    clock.current += timedelta(hours=30)
    mailer.sent.clear()
    assert client.get("/api/cron/digest", headers=headers).get_json()["sent"] == 0
    assert mailer.sent == []


def test_demo_seed_creates_a_usable_flat(app, client):
    home_id = seed_demo(app.extensions["compis"])
    response = client.post(
        "/api/login", json={"email": "lucia@demo.compis.app", "password": DEMO_PASSWORD}
    )
    token = response.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert response.get_json()["home_id"] == home_id
    tasks = client.get(f"/api/task/home/{home_id}", headers=headers).get_json()
    assert len(tasks) == 4
    debts = client.get("/api/debts/roomie/1", headers=headers).get_json()
    owed_to_lucia = [d for d in debts if d["roomie_paying_id"] == 1]
    lucia_owes = [d for d in debts if d["roomie_debtor_id"] == 1]
    assert len(owed_to_lucia) == 2
    assert [d["amount"] for d in lucia_owes] == [14.0]


def test_resetting_the_demo_replaces_only_demo_data(app, client, register):
    outsider = register("Nuria")
    outsider_home = outsider.post("/api/home", json={"name": "Mi piso"}).get_json()["home_id"]
    seed_demo(app.extensions["compis"])

    reset_demo(db.session)
    second_home = seed_demo(app.extensions["compis"])

    demo_roomies = (
        db.session.query(RoomieRow).filter(RoomieRow.email.like("%@demo.compis.app")).count()
    )
    assert demo_roomies == 3
    assert db.session.query(HomeRow).count() == 2
    login = client.post(
        "/api/login", json={"email": "marcos@demo.compis.app", "password": DEMO_PASSWORD}
    )
    assert login.status_code == 200
    assert login.get_json()["home_id"] == second_home
    assert outsider.get(f"/api/home/{outsider_home}").get_json()["name"] == "Mi piso"
