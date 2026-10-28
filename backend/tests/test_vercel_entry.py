import importlib.util
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def load_entry(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "vercel-entry-secret-vercel-entry-secret-123")
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@host:5432/db")
    monkeypatch.setenv("CRON_SECRET", "vercel-cron")
    spec = importlib.util.spec_from_file_location("vercel_entry", REPO / "api" / "index.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_serverless_entry_exposes_a_wsgi_app(monkeypatch):
    module = load_entry(monkeypatch)
    client = module.app.test_client()
    assert client.get("/api/health").get_json() == {"status": "ok"}
    assert module.app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgresql://")
    assert module.app.config["SQLALCHEMY_ENGINE_OPTIONS"]["pool_pre_ping"] is True


def test_vercel_cron_authenticates_with_the_bearer_secret(monkeypatch):
    module = load_entry(monkeypatch)
    client = module.app.test_client()
    assert client.get("/api/cron/digest").status_code == 401
    denied = client.get("/api/cron/digest", headers={"Authorization": "Bearer other"})
    assert denied.status_code == 401


def test_vercel_configuration_matches_the_project_layout():
    config = json.loads((REPO / "vercel.json").read_text(encoding="utf-8"))
    assert config["outputDirectory"] == "frontend/dist"
    assert (REPO / "frontend" / "package.json").exists()
    assert {"source": "/api/(.*)", "destination": "/api/index"} in config["rewrites"]
    assert config["rewrites"][-1]["destination"] == "/index.html"
    assert (REPO / "api" / "index.py").exists()
    cron = config["crons"][0]
    assert cron["path"] == "/api/cron/digest"
    root = (REPO / "requirements.txt").read_text(encoding="utf-8").split()
    backend = (REPO / "backend" / "requirements.txt").read_text(encoding="utf-8").split()
    assert root == backend
    assert sys.version_info >= (3, 12)
