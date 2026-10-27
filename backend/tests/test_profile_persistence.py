from fastapi.testclient import TestClient

from app.main import app
from app.models import CandidateProfilePayload, EducationModel, RadixCategoryCode, SkillModel
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
        "city_country",
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
    assert EducationModel.model_fields["cgpa"].default == ""
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


def test_city_country_survives_profile_save_and_load_without_database(monkeypatch):
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: False)
    monkeypatch.setattr(profile_service, "get_supabase_client", lambda: None)
    client = TestClient(app)
    payload = {**PROFILE_PAYLOAD, "city_country": "Delhi"}

    created = client.post("/api/profiles", json=payload)

    assert created.status_code == 201
    profile_id = created.json()["id"]
    assert created.json()["profile"]["city_country"] == "Delhi"

    loaded = client.get(f"/api/profiles/{profile_id}")

    assert loaded.status_code == 200
    assert loaded.json()["profile"]["city_country"] == "Delhi"


def test_education_cgpa_survives_create_update_and_reload(monkeypatch):
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: False)
    monkeypatch.setattr(profile_service, "get_supabase_client", lambda: None)
    client = TestClient(app)
    education = [{
        "degree": "B.Tech",
        "field_of_study": "Computer Science",
        "institution": "",
        "graduation_year": "2026",
        "cgpa": "8.6/10",
    }]

    created = client.post("/api/profiles", json={**PROFILE_PAYLOAD, "education": education})

    assert created.status_code == 201
    profile_id = created.json()["id"]
    assert created.json()["profile"]["education"][0]["cgpa"] == "8.6/10"
    assert client.get(f"/api/profiles/{profile_id}").json()["profile"]["education"][0]["cgpa"] == "8.6/10"

    updated = client.put(
        f"/api/profiles/{profile_id}",
        json={**PROFILE_PAYLOAD, "education": [{**education[0], "cgpa": "8.7/10"}]},
    )

    assert updated.status_code == 200
    assert updated.json()["profile"]["education"][0]["cgpa"] == "8.7/10"
    assert client.get(f"/api/profiles/{profile_id}").json()["profile"]["education"][0]["cgpa"] == "8.7/10"


def test_education_without_cgpa_remains_backward_compatible(monkeypatch):
    monkeypatch.setattr(profile_service, "is_supabase_configured", lambda: False)
    monkeypatch.setattr(profile_service, "get_supabase_client", lambda: None)
    client = TestClient(app)
    legacy_education = [{
        "degree": "B.Tech",
        "field_of_study": "Computer Science",
        "institution": "",
        "graduation_year": "2026",
    }]

    created = client.post("/api/profiles", json={**PROFILE_PAYLOAD, "education": legacy_education})

    assert created.status_code == 201
    assert created.json()["profile"]["education"][0]["cgpa"] == ""
    profile_id = created.json()["id"]
    assert client.get(f"/api/profiles/{profile_id}").json()["profile"]["education"][0]["cgpa"] == ""


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
