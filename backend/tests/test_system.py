from datetime import timedelta

from compis.interfaces.cli import DEMO_PASSWORD, seed_demo


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
    assert len(tasks) == 3
