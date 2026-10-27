"""Role 2 extraction, with offline heuristic as the default integration mode."""

import os
from pathlib import Path
from typing import Optional

from heuristic import heuristic_extract
from schema import LLMResumeExtraction, ResumeSkillList
from text_extract import extract_text

MODEL = os.getenv("RESUME_LLM_MODEL", "claude-sonnet-4-6")
MAX_CHARS = 24000

SYSTEM = """You are a technical recruiter's assistant that parses resumes.
Extract structured data from the resume text. Resumes vary wildly in layout, so
infer sections (Education, Projects, Experience, Skills, Certifications) from
content, not headings alone.

SKILLS: list every distinct technical skill, technology, tool and meaningful soft
skill the resume shows - including ones only IMPLIED by projects or experience
(e.g. a project that builds a REST backend with Flask implies Python + REST API).
Tag each skill with exactly one category_code:
  DSA   data structures & algorithms, competitive programming
  COD   programming languages / frameworks / hands-on coding
  OOD   object-oriented design, design patterns
  APTI  aptitude, quantitative & logical reasoning
  COMM  communication, leadership, teamwork, presentation
  AI    ML, deep learning, NLP, LLMs, data science
  CLOUD cloud platforms, containers, DevOps, CI/CD
  SQL   SQL & relational/NoSQL databases
  SWE   software engineering practice: git, testing, agile, APIs, debugging
  SYSD  system design, scalability, distributed systems
  NETW  networking
  OS    operating systems, Linux, concurrency
  OTHER anything outside these twelve
evidence: a SHORT quote (<=20 words) or reason from the resume.
confidence: high = explicitly listed AND demonstrated in a project/job;
medium = explicitly listed only, or clearly implied; low = weakly implied.
Do not invent skills or details that are not supported by the text. Use "" for
unknown strings and [] for empty lists. Deduplicate skills.

EDUCATION: Populate cgpa only when a CGPA is explicitly stated in the resume.
Do not infer a CGPA from a grade or other academic detail.

PREFERRED ROLES: Extract only roles explicitly listed under a Preferred Roles
section. Do not infer roles. Return them as a list of strings."""


def _llm_extract(text: str) -> LLMResumeExtraction:
    from langchain_anthropic import ChatAnthropic
    from langchain_core.prompts import ChatPromptTemplate

    llm = ChatAnthropic(model=MODEL, temperature=0, max_tokens=4096)
    chain = ChatPromptTemplate.from_messages(
        [("system", SYSTEM), ("human", "RESUME TEXT:\n\n{resume}")]
    ) | llm.with_structured_output(LLMResumeExtraction)
    return chain.invoke({"resume": text[:MAX_CHARS]})


def _dedupe(skills):
    rank = {"high": 3, "medium": 2, "low": 1}
    best = {}
    for skill in skills:
        key = skill.skill_name.strip().lower()
        if key and (key not in best or rank[skill.confidence] > rank[best[key].confidence]):
            best[key] = skill
    return list(best.values())


def parse_resume(path: str, use_llm: Optional[bool] = None) -> ResumeSkillList:
    text = extract_text(path)
    if use_llm is None:
        use_llm = bool(os.getenv("ANTHROPIC_API_KEY"))
    result = None
    if use_llm:
        try:
            result = _llm_extract(text)
        except Exception:
            result = None
    if result is None:
        result = heuristic_extract(text)
    result.skills = _dedupe(result.skills)
    return ResumeSkillList(**result.model_dump(), source_file=Path(path).name)
