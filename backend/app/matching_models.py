"""Request and response models for Roles 4 and 5 analysis."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models import CandidateProfilePayload, RadixCategoryCode, SkillConfidence


class MatchingContract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class JobSkill(MatchingContract):
    skill_name: str = Field(min_length=1)
    category_code: RadixCategoryCode
    evidence: str = ""
    confidence: SkillConfidence


class JobDescription(MatchingContract):
    source_type: Literal["jd"] = "jd"
    source_file: str = Field(min_length=1)
    company: str = Field(min_length=1)
    role: str = Field(min_length=1)
    skills: list[JobSkill] = Field(default_factory=list)


class TalentCheckRequest(MatchingContract):
    profile: CandidateProfilePayload
    company: str = Field(min_length=1)


class SkillMatchRequest(MatchingContract):
    profile: CandidateProfilePayload
    jd: JobDescription


class AnalyzeRequest(MatchingContract):
    profile: CandidateProfilePayload
    company: str = Field(min_length=1)
    jd: JobDescription


class FixtureAnalyzeRequest(MatchingContract):
    profile: CandidateProfilePayload
    company: str = Field(min_length=1)
    jd_source_file: str = Field(min_length=1)