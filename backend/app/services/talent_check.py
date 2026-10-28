"""Company readiness scoring for candidate profiles."""

import json
from pathlib import Path
from typing import Any

from app.models import CandidateProfilePayload, RadixCategoryCode


BASE_POINTS_PER_CONFIDENCE_WEIGHT = 2.0
CONFIDENCE_WEIGHTS = {"high": 1.0, "medium": 0.6, "low": 0.3}
EXPERIENCE_BONUSES = {"hackathons": 0.5, "internships": 1.0, "certifications": 0.5}
MAX_EXPERIENCE_BONUS_PER_CATEGORY = 2.0
DEFAULT_EXPECTATIONS_PATH = Path(__file__).parent.parent / "matching_data" / "company_skillsets.json"
VALID_CATEGORIES = set(RadixCategoryCode.__args__)


def load_company_expectations(path: str | Path = DEFAULT_EXPECTATIONS_PATH) -> dict[str, dict[str, int]]:
    """Load and validate company category requirements from JSON."""
    with Path(path).open(encoding="utf-8") as file:
        raw = json.load(file)
    if not isinstance(raw, dict) or not raw:
        raise ValueError("Company expectations must be a non-empty JSON object.")
    for company, categories in raw.items():
        if not isinstance(company, str) or not company.strip() or not isinstance(categories, dict):
            raise ValueError("Each company must map to a category-level object.")
        for category, level in categories.items():
            if category not in VALID_CATEGORIES:
                raise ValueError(f"Unknown category code '{category}' for company '{company}'.")
            if isinstance(level, bool) or not isinstance(level, int) or not 1 <= level <= 10:
                raise ValueError(f"Required level for {company}/{category} must be an integer from 1 to 10.")
    return raw


def _experience_category_bonus(profile: CandidateProfilePayload, category: str) -> float:
    total = 0.0
    for collection, bonus in EXPERIENCE_BONUSES.items():
        for record in getattr(profile, collection):
            if record.category_code == category or category in record.category_codes:
                total += bonus
    return min(total, MAX_EXPERIENCE_BONUS_PER_CATEGORY)


def run_talent_check(
    profile: CandidateProfilePayload,
    company: str,
    expectations_path: str | Path = DEFAULT_EXPECTATIONS_PATH,
) -> dict[str, Any]:
    """Score category readiness, counting only explicitly tagged experience."""
    expectations = load_company_expectations(expectations_path)
    if company not in expectations:
        raise ValueError(f"Unknown company '{company}'. Configured companies: {', '.join(expectations)}")

    candidate_levels: dict[str, float] = {}
    for skill in profile.skills:
        confidence = skill.confidence or "medium"
        candidate_levels[skill.category_code] = candidate_levels.get(skill.category_code, 0.0) + (
            BASE_POINTS_PER_CONFIDENCE_WEIGHT * CONFIDENCE_WEIGHTS[confidence]
        )

    rows = []
    weighted_readiness = 0.0
    total_required = 0
    for category, required in expectations[company].items():
        level = min(10.0, candidate_levels.get(category, 0.0) + _experience_category_bonus(profile, category))
        level = round(level, 1)
        rows.append({
            "category_code": category,
            "required_level": required,
            "candidate_level": level,
            "gap": level < required,
        })
        weighted_readiness += min(level / required, 1.0) * required
        total_required += required

    readiness = round(weighted_readiness / total_required * 100) if total_required else 100
    return {"company": company, "skillset_gap": rows, "readiness_score": readiness}