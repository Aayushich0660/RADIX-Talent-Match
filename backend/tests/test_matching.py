from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


PROFILE = {
    "name": "Jordan Taylor",
    "email": "jordan@example.com",
    "phone": None,
    "city_country": "",
    "education": [],
    "skills": [
        {
            "skill_name": "JS",
            "category_code": "COD",
            "evidence": "Built web applications",
            "confidence": "high",
        },
        {
            "skill_name": "Python",
            "category_code": "SWE",
            "evidence": "Built backend services",
            "confidence": None,
        },
    ],
    "hackathons": [],
    "internships": [],
    "certifications": [],
    "preferred_roles": ["Software Engineer"],
    "cv_file": None,
}

JD = {
    "source_type": "jd",
    "source_file": "test.json",
    "company": "Example",
    "role": "Developer",
    "skills": [
        {
            "skill_name": "JavaScript",
            "category_code": "COD",
            "evidence": "Build web applications",
            "confidence": "high",
        },
        {
            "skill_name": "Python",
            "category_code": "SWE",
            "evidence": "Backend services",
            "confidence": "low",
        },
    ],
}


def test_lists_company_expectations_and_job_fixtures():
    assert "Google" in client.get("/api/companies").json()
    jds = client.get("/api/jds").json()
    assert {jd["source_file"] for jd in jds} == {
        "google_swe.json",
        "microsoft_data_analyst.json",
    }
    assert client.get("/api/jds/google_swe.json").json()["company"] == "Google"


def test_matching_ui_routes_use_selected_fixture_filename():
    assert "Google" in client.get("/api/matching/companies").json()
    assert client.get("/api/matching/jds").status_code == 200

    response = client.post("/api/matching/analyze", json={
        "profile": PROFILE,
        "company": "Google",
        "jd_source_file": "google_swe.json",
    })

    assert response.status_code == 200
    assert set(response.json()) == {"talent_check", "skill_match"}
    assert response.json()["skill_match"]["jd_source_file"] == "google_swe.json"


def test_analysis_accepts_profile_builder_contract_and_combines_results():
    response = client.post("/api/analyze", json={"profile": PROFILE, "company": "Google", "jd": JD})

    assert response.status_code == 200
    result = response.json()
    assert set(result) == {"talent_check", "skill_match"}
    assert result["talent_check"]["company"] == "Google"
    assert result["talent_check"]["readiness_score"] in range(101)
    assert result["skill_match"]["match_score"] == 100
    assert [item["match_type"] for item in result["skill_match"]["matched_skills"]] == ["alias", "exact"]


def test_analysis_rejects_unknown_company_and_invalid_category():
    unknown_company = client.post("/api/talent-check", json={"profile": PROFILE, "company": "Unknown"})
    invalid_profile = {**PROFILE, "skills": [{**PROFILE["skills"][0], "category_code": "DEVOPS"}]}
    invalid_category = client.post("/api/talent-check", json={"profile": invalid_profile, "company": "Google"})

    assert unknown_company.status_code == 422
    assert "Unknown company" in unknown_company.json()["detail"]
    assert invalid_category.status_code == 422


def test_jd_fixture_path_traversal_is_rejected():
    assert client.get("/api/jds/../main.py").status_code == 404