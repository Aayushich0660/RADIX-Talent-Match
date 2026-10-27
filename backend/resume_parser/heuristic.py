"""Offline keyword-based fallback used when LLM extraction is not enabled."""

import re

from schema import Candidate, Education, Experience, LLMResumeExtraction, Project, Skill

KEYWORDS = {
    "DSA": ["data structures", "algorithms", "dsa", "leetcode", "dynamic programming", "graphs", "trees", "competitive programming", "codeforces", "hackerrank"],
    "COD": ["python", "java", "c++", "javascript", "typescript", "golang", "go", "rust", "c#", "kotlin", "react", "node.js", "flask", "django", "fastapi", "spring boot", "html", "css", "pandas", "numpy"],
    "OOD": ["object-oriented", "oop", "oops", "design patterns", "solid principles", "uml"],
    "APTI": ["aptitude", "quantitative", "logical reasoning", "problem solving", "analytical"],
    "COMM": ["communication", "presentation", "public speaking", "teamwork", "leadership", "stakeholder", "mentoring", "technical writing"],
    "AI": ["machine learning", "deep learning", "nlp", "llm", "langchain", "tensorflow", "pytorch", "scikit-learn", "computer vision", "generative ai", "neural networks", "data science", "xgboost", "transformers"],
    "CLOUD": ["aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform", "ci/cd", "devops", "lambda", "serverless", "jenkins"],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "oracle", "sql server", "database", "dbms", "nosql", "mongodb", "supabase", "joins", "stored procedures"],
    "SWE": ["git", "github", "agile", "scrum", "unit testing", "pytest", "junit", "rest api", "microservices", "code review", "jira", "software development", "sdlc", "debugging"],
    "SYSD": ["system design", "scalability", "load balancing", "caching", "distributed systems", "high-level design", "low-level design", "kafka", "redis", "message queue"],
    "NETW": ["networking", "tcp/ip", "http", "dns", "computer networks", "sockets", "firewall", "vpn", "cisco"],
    "OS": ["operating systems", "linux", "unix", "multithreading", "process scheduling", "memory management", "bash", "shell scripting"],
    "OTHER": ["power bi", "statistics", "a/b testing basics", "excel", "ticketing tools"],
}
DISPLAY = {
    "nlp": "NLP", "llm": "LLM", "aws": "AWS", "gcp": "GCP", "sql": "SQL",
    "dsa": "DSA", "oop": "OOP", "oops": "OOP", "html": "HTML", "css": "CSS",
    "ci/cd": "CI/CD", "rest api": "REST API", "tcp/ip": "TCP/IP", "dns": "DNS",
    "http": "HTTP", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "mongodb": "MongoDB", "pytorch": "PyTorch", "tensorflow": "TensorFlow",
    "power bi": "Power BI", "statistics": "Statistics",
    "a/b testing basics": "A/B Testing", "excel": "Excel",
    "ticketing tools": "Ticketing Tools",
}


def _evidence(text: str, match: re.Match) -> str:
    lines = text.splitlines(keepends=True)
    offsets = []
    offset = 0
    for line in lines:
        offsets.append((offset, offset + len(line), line.rstrip("\r\n")))
        offset += len(line)

    line_index = next(
        (index for index, (start, end, _) in enumerate(offsets) if start <= match.start() < end),
        None,
    )
    if line_index is None:
        return ""

    start, _, line = offsets[line_index]
    block = [line]
    match_end = max(match.start(), match.end() - 1)
    match_end_line = next(
        (
            index for index, (line_start, line_end, _) in enumerate(offsets)
            if line_start <= match_end < line_end
        ),
        line_index,
    )
    is_bullet = re.match(r"^\s*[-*•▪●]\s+", line) is not None
    for next_index, (_, _, next_line) in enumerate(
        offsets[line_index + 1:],
        start=line_index + 1,
    ):
        if next_index <= match_end_line:
            block.append(next_line)
            continue
        if is_bullet:
            if not next_line.strip() or re.match(r"^\s*[-*•▪●]\s+", next_line):
                break
            if _section_type(next_line) is not None:
                break
            block.append(next_line)

    evidence = re.sub(r"\s+", " ", " ".join(block)).strip()
    evidence = re.sub(r"^[-*•▪●]\s*", "", evidence)
    if len(evidence.split()) <= 20:
        return evidence

    words = list(re.finditer(r"\S+", evidence))
    matched_phrase = re.sub(r"\s+", " ", match.group())
    match_offset = evidence.lower().find(matched_phrase.lower())
    if match_offset < 0:
        match_offset = 0
    matched_word = next(
        (
            index for index, word in enumerate(words)
            if word.start() <= match_offset < word.end()
        ),
        0,
    )
    first = max(0, min(matched_word - 7, len(words) - 20))
    selected = words[first:first + 20]
    return evidence[selected[0].start():selected[-1].end()]


def _technical_skill_entries(text: str):
    lines = text.splitlines()
    skill_lines = []
    in_skills = False
    for line in lines:
        heading = re.sub(r"[\s:]+", " ", line).strip().lower()
        if heading in {"technical skills", "skills"}:
            in_skills = True
            continue
        if in_skills and _section_type(line) is not None:
            break
        if in_skills and line.strip():
            skill_lines.append(line.strip())

    section_text = re.sub(r"\s+", " ", " ".join(skill_lines)).strip()
    entries, current, depth = [], [], 0
    for character in section_text:
        if character == "(":
            depth += 1
        elif character == ")":
            depth = max(0, depth - 1)
        if character == "," and depth == 0:
            entry = "".join(current).strip()
            if entry:
                entries.append(entry)
            current = []
        else:
            current.append(character)
    entry = "".join(current).strip()
    if entry:
        entries.append(entry)
    return entries


def _is_role_fit_mention(text: str, match: re.Match) -> bool:
    sentence_start = max(
        text.rfind(".", 0, match.start()),
        text.rfind("!", 0, match.start()),
        text.rfind("?", 0, match.start()),
    ) + 1
    sentence_ends = [
        position
        for marker in (".", "!", "?")
        if (position := text.find(marker, match.end())) >= 0
    ]
    sentence_end = min(sentence_ends) if sentence_ends else len(text)
    sentence = text[sentence_start:sentence_end]
    return (
        re.search(r"\b(?:best|good|strong|weak|weaker)\s+fit\s+for\b", sentence, re.I)
        is not None
        and re.search(r"\b(?:roles?|positions?|jobs?)\b", sentence, re.I) is not None
    )


def _section_type(line: str):
    heading = re.sub(r"[\s:]+", " ", line).strip().lower()
    if heading == "education":
        return "education"
    if re.fullmatch(r"(?:(?:academic|selected|personal) )?projects?", heading):
        return "projects"
    if re.fullmatch(r"hackathons? / internships?", heading):
        return "activities"
    if re.fullmatch(r"(?:work |professional )?experience|internships?", heading):
        return "activities"
    if re.fullmatch(r"certifications?(?: and licenses?)?|licenses?", heading):
        return "certifications"
    if heading == "preferred roles":
        return "preferred_roles"
    if re.fullmatch(
        r"technical skills|skills|achievements|preferred roles|"
        r"languages|summary|profile|objective|contact",
        heading,
    ):
        return "other"
    return None


def _section_lines(text: str):
    sections = {
        "education": [],
        "projects": [],
        "activities": [],
        "certifications": [],
        "preferred_roles": [],
    }
    current = None
    for line in text.splitlines():
        section = _section_type(line)
        if section is not None:
            current = section if section in sections else None
        elif current is not None:
            sections[current].append(line.strip())
    return sections


def _education_from_item(item: str):
    education_parts = re.split(
        r"\s+(?:—|–|�)\s+|\s+(?=CGPA\b|GPA\b)",
        item,
        maxsplit=1,
        flags=re.I,
    )
    head = education_parts[0]
    grade_text = education_parts[1] if len(education_parts) > 1 else ""
    year_match = re.search(
        r"\b(?:class\s+of|expected(?:\s+graduation)?|graduation(?:\s+year)?)\s*(\d{4})\b",
        head,
        re.I,
    )
    parts = [part.strip() for part in head.split(",") if part.strip()]
    degree = parts[0] if parts else ""
    field = parts[1] if len(parts) > 1 else ""
    field = re.sub(
        r",?\s*\b(?:class\s+of|expected(?:\s+graduation)?|graduation(?:\s+year)?)\s*\d{4}\b.*$",
        "",
        field,
        flags=re.I,
    ).strip(" ,")
    grade = grade_text.strip()
    cgpa_match = re.search(
        r"\bCGPA\b\s*:?\s*(\d+(?:\.\d+)?)\s*(?:/\s*(\d+(?:\.\d+)?))?",
        grade_text,
        re.I,
    )
    cgpa = (
        f"{cgpa_match.group(1)}/{cgpa_match.group(2)}"
        if cgpa_match and cgpa_match.group(2)
        else cgpa_match.group(1) if cgpa_match
        else None
    )
    return Education(
        degree=degree,
        field=field,
        end_year=year_match.group(1) if year_match else None,
        grade=grade or None,
        cgpa=cgpa,
    )


def _section_items(lines):
    items, current = [], ""
    for line in lines:
        if not line:
            continue
        is_bullet = re.match(r"^[-*•▪●]\s*", line) is not None
        value = re.sub(r"^[-*•▪●]\s*", "", line).strip()
        starts_item = is_bullet or not current or value[:1].isupper()
        if starts_item and current:
            items.append(current)
            current = value
        elif current:
            current = f"{current} {value}"
        else:
            current = value
    if current:
        items.append(current)
    return items


def _split_description(item: str):
    parts = re.split(r"\s+(?:—|–|�)\s+|\s+-\s+", item, maxsplit=1)
    return parts[0].strip(), parts[1].strip() if len(parts) > 1 else ""


def _project_title(item: str) -> str:
    match = re.match(
        r"^(?:built|created|developed|implemented|designed|contributed to)"
        r"\s+(?:a|an|the)?\s*(.+?)(?:\s+(?:using|with|for|to)\b|,\s*|$)",
        item,
        re.I,
    )
    return match.group(1).strip() if match else item


def _project_from_item(item: str) -> Project:
    technologies = [
        name for name in ("Java", "MySQL")
        if re.search(rf"\b{re.escape(name)}\b", item, re.I)
    ]
    return Project(title=_project_title(item), description=item, technologies=technologies)


def _hackathon_from_item(item: str) -> Project:
    head, details = _split_description(item)
    match = re.search(r"\bhackathon\b", head, re.I)
    if match is None:
        return Project(title=item, description="")
    title_start = head.rfind(",", 0, match.start()) + 1
    title = head[title_start:].strip(" ,")
    outcome = head[:title_start].strip(" ,")
    description = " — ".join(part for part in (outcome, details) if part)
    return Project(title=title, description=description)


def _experience_from_item(item: str) -> Experience:
    role_and_company, description = _split_description(item)
    match = re.match(r"(?P<role>.+?)\s+(?:at|with)\s+(?P<company>.+)", role_and_company, re.I)
    if match:
        role = match.group("role").strip(" ,")
        company = match.group("company").strip()
    else:
        role, company = role_and_company, ""
    return Experience(role=role, company=company, description=description)


def heuristic_extract(text: str) -> LLMResumeExtraction:
    skills, seen = [], set()
    matching_text = re.sub(r"\s+", " ", text)
    technical_entries = _technical_skill_entries(text)
    for category, keywords in KEYWORDS.items():
        for keyword in keywords:
            match = re.search(rf"(?<![\w+#.]){re.escape(keyword)}(?![\w+#])", matching_text, re.I)
            if match and keyword not in seen:
                evidence_pattern = r"(?<![\w+#.])" + r"\s+".join(
                    re.escape(part) for part in keyword.split()
                ) + r"(?![\w+#])"
                technical_evidence = next(
                    (
                        entry for entry in technical_entries
                        if re.search(evidence_pattern, entry, re.I)
                    ),
                    None,
                )
                if category == "OTHER" and technical_evidence is None:
                    continue
                evidence_match = None
                if technical_evidence is None:
                    evidence_match = next(
                        (
                            candidate
                            for candidate in re.finditer(evidence_pattern, text, re.I)
                            if not _is_role_fit_mention(text, candidate)
                        ),
                        None,
                    )
                    if evidence_match is None:
                        continue
                seen.add(keyword)
                skills.append(
                    Skill(
                        skill_name=DISPLAY.get(keyword, keyword.title() if len(keyword) > 3 else keyword.upper()),
                        category_code=category,
                        evidence=technical_evidence or _evidence(text, evidence_match),
                        confidence="medium",
                    )
                )
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone = re.search(r"(\+?\d[\d\s-]{8,14}\d)", text)
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    sections = _section_lines(text)
    education = [
        _education_from_item(item)
        for item in _section_items(sections["education"])
    ]
    projects = [_project_from_item(item) for item in _section_items(sections["projects"])]
    activities = _section_items(sections["activities"])
    projects.extend(
        _hackathon_from_item(item)
        for item in activities
        if re.search(r"\bhackathon\b", item, re.I)
    )
    experience = [
        _experience_from_item(item)
        for item in activities
        if re.search(r"\bintern\b", item, re.I)
    ]
    return LLMResumeExtraction(
        candidate=Candidate(
            name=first_line if len(first_line.split()) <= 4 else "",
            email=email.group(0) if email else "",
            phone=phone.group(1).strip() if phone else "",
        ),
        education=education,
        projects=projects,
        experience=experience,
        certifications=_section_items(sections["certifications"]),
        preferred_roles=[
            role.strip()
            for line in sections["preferred_roles"]
            for role in line.split(",")
            if role.strip()
        ],
        skills=skills,
    )
