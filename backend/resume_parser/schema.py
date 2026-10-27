"""Copied Role 2 extraction contract; intentionally independent of Role 3 models."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

CATEGORY_CODES = [
    "DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD",
    "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER",
]
CategoryCode = Literal[
    "DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD",
    "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER",
]


class Skill(BaseModel):
    skill_name: str
    category_code: CategoryCode = "OTHER"
    evidence: str = ""
    confidence: Literal["high", "medium", "low"] = "medium"

    @field_validator("category_code", mode="before")
    @classmethod
    def normalize_category(cls, value):
        normalized = str(value).strip().upper()
        return normalized if normalized in CATEGORY_CODES else "OTHER"

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, value):
        normalized = str(value).strip().lower()
        return normalized if normalized in ("high", "medium", "low") else "medium"


class Education(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    grade: Optional[str] = None
    cgpa: Optional[str] = None


class Project(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)


class Experience(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)


class Candidate(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""


class LLMResumeExtraction(BaseModel):
    candidate: Candidate = Field(default_factory=Candidate)
    education: List[Education] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)


class ResumeSkillList(LLMResumeExtraction):
    source_type: Literal["resume"] = "resume"
    source_file: str = ""
    company: str = ""
    role: str = ""
