"""
Pydantic Models for RADIX Talent Match — Candidate Profile Builder
Conforms strictly to the shared candidate-profile JSON contract.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
import re

# Approved RADIX Category Codes
RadixCategoryCode = Literal[
    'COD',   # Coding
    'DSA',   # Data Structures & Algorithms
    'OOD',   # Object-Oriented Design
    'APTI',  # Aptitude
    'COMM',  # Communication
    'AI',    # Artificial Intelligence
    'CLOUD', # Cloud
    'SQL',   # SQL
    'SWE',   # Software Engineering
    'SYSD',  # System Design
    'NETW',  # Networking
    'OS',    # Operating Systems
    'OTHER', # Other
]

VALID_RADIX_CODES = {
    'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD',
    'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER'
}

SkillConfidence = Literal['high', 'medium', 'low']


class EducationModel(BaseModel):
    degree: str = Field(..., description="Degree or qualification (e.g. Bachelor's Degree)")
    field_of_study: str = Field(default="", description="Specialization or major")
    institution: str = Field(..., description="University, college, or school name")
    graduation_year: str = Field(default="", description="Year of graduation or expected")
    cgpa: str = Field(default="", description="Explicitly reported cumulative GPA")

    @field_validator('degree', 'institution', mode='before')
    @classmethod
    def trim_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class SkillModel(BaseModel):
    skill_name: str = Field(..., min_length=1, description="Name of the skill or technology")
    category_code: RadixCategoryCode = Field(..., description="One of 13 official RADIX category codes")
    evidence: str = Field(default="", description="Portfolio link, project proof, or assessment evidence")
    confidence: Optional[SkillConfidence] = Field(default=None, description="Confidence rating: high, medium, low, or null")

    @field_validator('skill_name', mode='before')
    @classmethod
    def trim_skill_name(cls, v: str) -> str:
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Skill name cannot be empty or whitespace-only.")
            return trimmed
        return v

    @field_validator('category_code', mode='before')
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_RADIX_CODES:
            raise ValueError(f"Invalid RADIX category code '{v}'. Allowed: {sorted(list(VALID_RADIX_CODES))}")
        return v


class HackathonProjectModel(BaseModel):
    type: Literal['hackathon', 'project'] = Field(default='project')
    name: str = Field(default="")
    title: str = Field(default="")
    description: str = Field(default="")
    technologies: List[str] = Field(default_factory=list)
    date_or_year: str = Field(default="")


class InternshipModel(BaseModel):
    company: str = Field(default="")
    role: str = Field(default="")
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    is_ongoing: bool = Field(default=False)
    description: str = Field(default="")
    technologies: List[str] = Field(default_factory=list)


class CertificationModel(BaseModel):
    name: str = Field(default="")
    issuing_organization: str = Field(default="")
    issue_year: str = Field(default="")
    credential_url: str = Field(default="")


class CandidateProfilePayload(BaseModel):
    name: str = Field(..., min_length=2, description="Candidate full name (no numbers allowed)")
    email: str = Field(..., description="Valid candidate email address")
    phone: Optional[str] = Field(default=None, description="Formatted phone with country dial code or null")
    city_country: str = Field(default="", description="Candidate city and country")
    education: List[EducationModel] = Field(default_factory=list)
    skills: List[SkillModel] = Field(default_factory=list)
    hackathons: List[HackathonProjectModel] = Field(default_factory=list)
    internships: List[InternshipModel] = Field(default_factory=list)
    certifications: List[CertificationModel] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    cv_file: Optional[str] = Field(default=None, description="Uploaded CV filename string or null")

    @field_validator('name', mode='before')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Candidate name is required and cannot be blank.")
        trimmed = v.strip()
        if re.search(r'\d', trimmed):
            raise ValueError("Candidate name cannot contain numbers.")
        if len(trimmed) < 2:
            raise ValueError("Candidate name must be at least 2 characters.")
        return trimmed

    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Candidate email is required.")
        trimmed = v.strip()
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, trimmed):
            raise ValueError("Invalid email format.")
        return trimmed

    @field_validator('phone', mode='before')
    @classmethod
    def clean_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class ProfileResponse(BaseModel):
    id: str = Field(..., description="Unique persistent identifier (UUID)")
    profile: CandidateProfilePayload
    created_at: str
    updated_at: str
