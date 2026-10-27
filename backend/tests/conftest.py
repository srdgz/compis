from datetime import date, datetime

import pytest

from compis.bootstrap import create_app
from compis.config import Settings
from compis.infrastructure.db.extensions import db


class FixedClock:
    def __init__(self) -> None:
        self.current = datetime(2026, 11, 2, 10, 0)

    def now(self) -> datetime:
        return self.current

    def today(self) -> date:
        return self.current.date()


class RecordingMailer:
    def __init__(self) -> None:
        self.sent: list[tuple[str, list[str]]] = []

    def send(self, subject: str, html: str, recipients: list[str]) -> None:
        self.sent.append((subject, recipients))


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock()


@pytest.fixture
def mailer() -> RecordingMailer:
    return RecordingMailer()


@pytest.fixture
def app(clock, mailer):
    settings = Settings(testing=True, cron_secret="cron-secret")
    app = create_app(settings, clock=clock, mailer=mailer)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


class Session:
    def __init__(self, client, roomie_id: int, headers: dict) -> None:
        self.client = client
        self.id = roomie_id
        self.headers = headers

    def get(self, url, **kwargs):
        return self.client.get(url, headers=self.headers, **kwargs)

    def post(self, url, json=None):
        return self.client.post(url, json=json, headers=self.headers)

    def put(self, url, json=None):
        return self.client.put(url, json=json, headers=self.headers)

    def delete(self, url):
        return self.client.delete(url, headers=self.headers)


@pytest.fixture
def register(client):
    def _register(name: str) -> Session:
        email = f"{name.lower()}@example.com"
        body = {"email": email, "password": "password-123", "first_name": name}
        assert client.post("/api/signup", json=body).status_code == 201
        response = client.post("/api/login", json={"email": email, "password": "password-123"})
        data = response.get_json()
        return Session(client, data["roomie_id"], {"Authorization": f"Bearer {data['token']}"})

    return _register


@pytest.fixture
def flat(register):
    owner = register("Lucia")
    marcos = register("Marcos")
    aitana = register("Aitana")
    created = owner.post("/api/home", json={"name": "Piso Test"}).get_json()
    home_id = created["home_id"]
    assert (
        owner.post(f"/api/home/{home_id}", json={"email": "marcos@example.com"}).status_code == 200
    )
    assert (
        owner.post(f"/api/home/{home_id}", json={"email": "aitana@example.com"}).status_code == 200
    )
    return {
        "owner": owner,
        "marcos": marcos,
        "aitana": aitana,
        "home_id": home_id,
        "list_id": created["shopping_list_id"],
    }
