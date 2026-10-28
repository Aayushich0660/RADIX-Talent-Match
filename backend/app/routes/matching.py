"""HTTP endpoints for Roles 4 (Talent Check) and 5 (Skill Matching)."""

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

from app.matching_models import (
    AnalyzeRequest,
    FixtureAnalyzeRequest,
    JobDescription,
    SkillMatchRequest,
    TalentCheckRequest,
)
from app.services.skill_matching import run_skill_match
from app.services.talent_check import load_company_expectations, run_talent_check


router = APIRouter(prefix="/api", tags=["Talent Check and Skill Matching"])
JD_DIR = Path(__file__).parent.parent / "matching_data" / "jds"


def _read_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail=f"Unable to load fixture '{path.name}': {error}") from error


@router.get("/companies")
@router.get("/matching/companies")
def list_companies() -> list[str]:
    try:
        return list(load_company_expectations())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/jds")
@router.get("/matching/jds")
def list_jds() -> list[dict[str, str]]:
    fixtures = []
    for path in sorted(JD_DIR.glob("*.json")):
        jd = JobDescription.model_validate(_read_json(path))
        fixtures.append({"source_file": jd.source_file, "company": jd.company, "role": jd.role})
    return fixtures


@router.get("/jds/{source_file}")
def get_jd(source_file: str) -> dict[str, Any]:
    if Path(source_file).name != source_file or not source_file.endswith(".json"):
        raise HTTPException(status_code=404, detail="Job description fixture not found.")
    path = JD_DIR / source_file
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Job description fixture not found.")
    return JobDescription.model_validate(_read_json(path)).model_dump()


@router.post("/talent-check")
def talent_check(request: TalentCheckRequest) -> dict[str, Any]:
    try:
        return run_talent_check(request.profile, request.company)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/skill-match")
def skill_match(request: SkillMatchRequest) -> dict[str, Any]:
    return run_skill_match(request.profile, request.jd)


@router.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    try:
        return {
            "talent_check": run_talent_check(request.profile, request.company),
            "skill_match": run_skill_match(request.profile, request.jd),
        }
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/matching/analyze")
def analyze_fixture(request: FixtureAnalyzeRequest) -> dict[str, Any]:
    if Path(request.jd_source_file).name != request.jd_source_file or not request.jd_source_file.endswith(".json"):
        raise HTTPException(status_code=404, detail="Job description fixture not found.")
    path = JD_DIR / request.jd_source_file
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Job description fixture not found.")
    jd = JobDescription.model_validate(_read_json(path))
    try:
        return {
            "talent_check": run_talent_check(request.profile, request.company),
            "skill_match": run_skill_match(request.profile, jd),
        }
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error