from fastapi.testclient import TestClient

from app.main import app
from app.models import CandidateProfilePayload, RadixCategoryCode, SkillModel
from app.services import profile_service
from typing import get_args


PROFILE_PAYLOAD = {
    "name": "RADIX WRITE FAILURE TEST",
    "email": "radix.write.failure@example.test",
    "phone": None,
    "education": [],
    "skills": [],
    "hackathons": [],
    "internships": [],
    "certifications": [],
    "preferred_roles": [],
    "cv_file": None,
}


class FailingQuery:
    def insert(self, data):
        return self

    def update(self, data):
        return self

    def delete(self):
        return self

    def eq(self, field, value):
        return self

    def execute(self):
        raise RuntimeError("simulated database failure")


class FailingClient:
    def table(self, name):
        return FailingQuery()


class EmptyQuery:
    def select(self, fields):
        return self

    def range(self, start, end):
        return self

    def eq(self, field, value):
        return self

    def update(self, data):
        return self

    def delete(self):
        return self

    def execute(self):
        return type("Response", (), {"data": []})()


class EmptyClient:
    def table(self, name):
        return EmptyQuery()


def test_backend_models_match_shared_profile_contract():
    assert set(CandidateProfilePayload.model_fields) == {
        "name",
        "email",
        "phone",
        "education",
        "skills",
        "hackathons",
        "internships",
        "certifications",
        "preferred_roles",
        "cv_file",
    }
    assert set(SkillModel.model_fields) == {
        "skill_name",
        "category_code",
        "evidence",
        "confidence",
    }
    assert set(get_args(RadixCategoryCode)) == {
        "COD",
        "DSA",
        "OOD",
        "APTI",
        "COMM",
        "AI",
        "CLOUD",
        "SQL",
        "SWE",
        "SYSD",
        "NETW",
        "OS",
        "OTHER",
    }


def test_configured_but_unavailable_client_does_not_use_memory(monkeypatch):
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: True)
    monkeypatch.setattr(profile_service, "get_supabase_client", lambda: None)
    original_store = dict(profile_service._in_memory_store)

    response = TestClient(app).post("/api/profiles", json=PROFILE_PAYLOAD)

    assert response.status_code == 503
    assert "client is unavailable" in response.json()["detail"]
    assert profile_service._in_memory_store == original_store


def test_supabase_write_errors_return_service_unavailable(monkeypatch):
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: True)
    monkeypatch.setattr(profile_service, "get_supabase_client", FailingClient)
    original_store = dict(profile_service._in_memory_store)
    client = TestClient(app)

    created = client.post("/api/profiles", json=PROFILE_PAYLOAD)
    updated = client.put("/api/profiles/not-found-test", json=PROFILE_PAYLOAD)
    deleted = client.delete("/api/profiles/not-found-test")

    assert created.status_code == 503
    assert "not confirmed saved" in created.json()["detail"]
    assert updated.status_code == 503
    assert "not confirmed updated" in updated.json()["detail"]
    assert deleted.status_code == 503
    assert "not confirmed deleted" in deleted.json()["detail"]
    assert profile_service._in_memory_store == original_store


def test_empty_database_results_do_not_return_stale_memory_profiles(monkeypatch):
    profile_id = "stale-memory-profile"
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: True)
    monkeypatch.setattr(profile_service, "get_supabase_client", EmptyClient)
    monkeypatch.setitem(
        profile_service._in_memory_store,
        profile_id,
        {
            "id": profile_id,
            "profile": PROFILE_PAYLOAD,
            "created_at": "2026-01-01T00:00:00+00:00",
            "updated_at": "2026-01-01T00:00:00+00:00",
        },
    )
    client = TestClient(app)

    assert client.get(f"/api/profiles/{profile_id}").status_code == 404
    assert client.get("/api/profiles").json() == []
    assert client.put(f"/api/profiles/{profile_id}", json=PROFILE_PAYLOAD).status_code == 404
    assert client.delete(f"/api/profiles/{profile_id}").status_code == 404
