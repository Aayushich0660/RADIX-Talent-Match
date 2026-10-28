"""Deterministic candidate-to-job-description skill matching."""

from difflib import SequenceMatcher
import re
from typing import Any

from app.matching_models import JobDescription
from app.models import CandidateProfilePayload, SkillModel

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None


FUZZY_MATCH_THRESHOLD = 85
CONFIDENCE_WEIGHTS = {"high": 1.0, "medium": 0.6, "low": 0.3}
ALIASES = {
    "dsa": "data structures and algorithms",
    "js": "javascript",
    "postgres": "postgresql",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "oop": "object oriented programming",
}


def normalize_skill(skill: str) -> str:
    """Normalize punctuation and known aliases for comparison."""
    normalized = re.sub(r"[^a-z0-9]+", " ", skill.casefold()).strip()
    normalized = re.sub(r"\s+", " ", normalized)
    return ALIASES.get(normalized, normalized)


def _fuzzy_score(left: str, right: str) -> float:
    if fuzz is not None:
        return float(fuzz.ratio(left, right))
    return SequenceMatcher(None, left, right).ratio() * 100


def compare_skills(candidate_skills: list[str], jd_skills: list[str]) -> dict[str, list[str]]:
    """Compatibility helper for callers using the original string-list API."""
    normalized_candidates = {normalize_skill(skill) for skill in candidate_skills}
    matched, missing = [], []
    for skill in jd_skills:
        (matched if normalize_skill(skill) in normalized_candidates else missing).append(skill)
    return {"matched_skills": matched, "missing_skills": missing}


def run_skill_match(
    profile: CandidateProfilePayload,
    jd: JobDescription,
    fuzzy_threshold: int = FUZZY_MATCH_THRESHOLD,
) -> dict[str, Any]:
    """Match required skills only within their RADIX category."""
    candidates = [(skill, normalize_skill(skill.skill_name)) for skill in profile.skills]
    matched_skills: list[dict[str, Any]] = []
    missing_skills: list[dict[str, str]] = []
    matched_weight = 0.0
    total_weight = 0.0

    for jd_skill in jd.skills:
        required_weight = CONFIDENCE_WEIGHTS[jd_skill.confidence]
        total_weight += required_weight
        jd_name = normalize_skill(jd_skill.skill_name)
        same_category = [
            (item, name)
            for item, name in candidates
            if item.category_code == jd_skill.category_code
        ]
        exact = [(item, name) for item, name in same_category if name == jd_name]
        match: tuple[SkillModel, str] | None = (exact[0][0], "exact") if exact else None

        if match is None and same_category:
            best_item, _, best_score = max(
                ((item, name, _fuzzy_score(name, jd_name)) for item, name in same_category),
                key=lambda candidate: candidate[2],
            )
            if best_score >= fuzzy_threshold:
                match = (best_item, "fuzzy")

        if match is None:
            missing_skills.append({
                "skill_name": jd_skill.skill_name,
                "category_code": jd_skill.category_code,
                "reason": "No exact, alias, or sufficiently similar candidate skill in the same category.",
            })
            continue

        candidate_skill, match_type = match
        if match_type == "exact" and candidate_skill.skill_name.casefold().strip() != jd_skill.skill_name.casefold().strip():
            match_type = "alias"
        matched_weight += required_weight
        matched_skills.append({
            "candidate_skill": candidate_skill.model_dump(),
            "jd_skill": jd_skill.model_dump(),
            "match_type": match_type,
        })

    score = 100 if total_weight == 0 else round(matched_weight / total_weight * 100)
    return {
        "jd_source_file": jd.source_file,
        "match_score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }