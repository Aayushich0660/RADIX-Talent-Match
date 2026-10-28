"""Shared data contract. Put this in backend/shared/schemas.py and have the whole team import from it."""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER",
]
VALID_CODES = set(CategoryCode.__args__)


class Skill(BaseModel):
    skill_name: str
    category_code: CategoryCode
    evidence: str = Field(description="Short quote from the document or a brief reason")
    confidence: Literal["high", "medium", "low"]


class SkillList(BaseModel):
    source_type: Literal["jd", "resume"]
    source_file: str
    company: Optional[str] = None
    role: Optional[str] = None
    skills: List[Skill]
