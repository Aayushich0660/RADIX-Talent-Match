import {
  CandidateProfileState,
  CertificationRecord,
  EducationRecord,
  HackathonProjectRecord,
  SkillRecord,
} from '../types/profile';
import { COUNTRY_CODES } from './validation';
import {
  isParserCategoryCode,
  isParserConfidence,
  isParserRecord,
  ParsedResume,
  parserString,
} from '../api/resumeParser';

export interface UnmappedExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
  technologies: string[];
}

export interface ResumeMergeResult {
  profile: CandidateProfileState;
  conflicts: string[];
  unmapped: string[];
  experience: UnmappedExperience[];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(parserString).filter(Boolean) : [];
}

function extractCgpa(value: Record<string, unknown>): string {
  const explicitCgpa = parserString(value.cgpa);
  const rawGrade = parserString(value.grade);
  const match = explicitCgpa.match(
    /^\s*(?:CGPA\s*:?\s*)?(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*$/i,
  ) ?? rawGrade.match(
    /\bCGPA\b\s*:?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/i,
  );
  if (!match) return '';
  return match[2] ? `${match[1]}/${match[2]}` : match[1];
}

function profileId(prefix: string, index: number): string {
  return `parsed-${prefix}-${Date.now()}-${index}`;
}

function toExperience(value: unknown): UnmappedExperience | null {
  if (!isParserRecord(value)) return null;
  return {
    company: parserString(value.company),
    role: parserString(value.role),
    duration: parserString(value.duration),
    description: parserString(value.description),
    technologies: stringList(value.technologies),
  };
}

function withParsedPhone(profile: CandidateProfileState, phone: string) {
  const matchingCode = COUNTRY_CODES
    .filter(({ code }) => phone.startsWith(code))
    .sort((left, right) => right.code.length - left.code.length)[0];
  if (matchingCode) {
    return {
      phone: phone.slice(matchingCode.code.length).trim(),
      countryCode: matchingCode.code,
    };
  }
  return { phone, countryCode: profile.personal.countryCode || '+91' };
}

export function mergeParsedResume(
  current: CandidateProfileState,
  parsed: ParsedResume,
  selectedFileName: string,
): ResumeMergeResult {
  const profile: CandidateProfileState = {
    ...current,
    personal: { ...current.personal },
    education: current.education.filter((item) =>
      item.degree.trim() ||
      item.fieldOfStudy.trim() ||
      item.institution.trim() ||
      item.graduationYear.trim() ||
      item.cgpa?.trim()
    ),
    skills: [...current.skills],
    hackathons: [...current.hackathons],
    internships: [...current.internships],
    certifications: [...current.certifications],
    preferredRoles: [...current.preferredRoles],
  };
  const conflicts: string[] = [];
  const unmapped: string[] = [];
  const candidate = isParserRecord(parsed.candidate) ? parsed.candidate : {};
  const parsedName = parserString(candidate.name);
  const parsedEmail = parserString(candidate.email);
  const parsedPhone = parserString(candidate.phone);

  const mergeIdentity = (field: 'fullName' | 'email', value: string, label: string) => {
    if (!value) return;
    const entered = profile.personal[field].trim();
    if (!entered) profile.personal[field] = value;
    else if (entered.toLocaleLowerCase() !== value.toLocaleLowerCase()) {
      conflicts.push(`${label}: entered “${entered}”; parsed “${value}”. Your entered value was kept.`);
    }
  };
  mergeIdentity('fullName', parsedName, 'Candidate name');
  mergeIdentity('email', parsedEmail, 'Candidate email');

  if (parsedPhone) {
    if (!profile.personal.phone.trim()) {
      const phone = withParsedPhone(profile, parsedPhone);
      profile.personal.phone = phone.phone;
      profile.personal.countryCode = phone.countryCode;
    } else if (profile.personal.phone.trim() !== parsedPhone) {
      conflicts.push(`Candidate phone: entered “${profile.personal.phone.trim()}”; parsed “${parsedPhone}”. Your entered value was kept.`);
    }
  }

  if (parsed.education != null && !Array.isArray(parsed.education)) {
    unmapped.push('Education was returned in an unsupported format and was not added.');
  } else {
    (parsed.education ?? []).forEach((value, index) => {
      if (!isParserRecord(value)) {
        unmapped.push(`Education item ${index + 1} could not be read.`);
        return;
      }
      const record: EducationRecord = {
        id: profileId('education', index),
        degree: parserString(value.degree),
        fieldOfStudy: parserString(value.field),
        institution: parserString(value.institution),
        graduationYear: parserString(value.end_year),
        cgpa: extractCgpa(value),
      };
      if (parserString(value.start_year)) {
        unmapped.push(`Education item ${index + 1} start year "${parserString(value.start_year)}" is not represented in the Role 3 education fields; review it manually.`);
      }
      if (parserString(value.grade) && !record.cgpa) {
        unmapped.push(`Education item ${index + 1} grade "${parserString(value.grade)}" has no field in the Role 3 profile; review it manually.`);
      }
      if (!record.degree && !record.fieldOfStudy && !record.institution && !record.graduationYear && !record.cgpa) return;
      const duplicateIndex = profile.education.findIndex((existing) =>
        existing.degree.trim().toLowerCase() === record.degree.toLowerCase() &&
        existing.institution.trim().toLowerCase() === record.institution.toLowerCase() &&
        existing.fieldOfStudy.trim().toLowerCase() === record.fieldOfStudy.toLowerCase()
      );
      if (duplicateIndex >= 0) {
        const existing = profile.education[duplicateIndex];
        if (!existing.cgpa?.trim() && record.cgpa) {
          profile.education[duplicateIndex] = { ...existing, cgpa: record.cgpa };
        }
        return;
      }
      const emptySlot = profile.education.findIndex((existing) =>
        !existing.degree.trim() &&
        !existing.fieldOfStudy.trim() &&
        !existing.institution.trim() &&
        !existing.graduationYear.trim() &&
        !existing.cgpa?.trim()
      );
      if (emptySlot >= 0) {
        profile.education[emptySlot] = { ...record, id: profile.education[emptySlot].id };
      } else {
        profile.education.push(record);
      }
    });
  }

  parsed.skills.forEach((value, index) => {
    if (!isParserRecord(value)) {
      unmapped.push(`Skill item ${index + 1} could not be read.`);
      return;
    }
    const skillName = parserString(value.skill_name);
    if (!skillName || !isParserCategoryCode(value.category_code)) {
      unmapped.push(`Skill item ${index + 1} has a missing name or unsupported category code and was not added.`);
      return;
    }
    if (profile.skills.some((skill) =>
      skill.skillName.trim().toLowerCase() === skillName.toLowerCase() &&
      skill.categoryCode === value.category_code
    )) return;
    const skill: SkillRecord = {
      id: profileId('skill', index),
      skillName,
      categoryCode: value.category_code,
      evidence: parserString(value.evidence),
      confidence: isParserConfidence(value.confidence) ? value.confidence : null,
    };
    profile.skills.push(skill);
  });

  if (parsed.preferred_roles != null && !Array.isArray(parsed.preferred_roles)) {
    unmapped.push('Preferred roles were returned in an unsupported format and were not added.');
  } else {
    (parsed.preferred_roles ?? []).forEach((value) => {
      const role = parserString(value);
      if (!role || profile.preferredRoles.some(
        (existing) => existing.trim().toLowerCase() === role.toLowerCase(),
      )) return;
      profile.preferredRoles.push(role);
    });
  }

  if (parsed.projects != null && !Array.isArray(parsed.projects)) {
    unmapped.push('Projects were returned in an unsupported format and were not added.');
  } else {
    (parsed.projects ?? []).forEach((value, index) => {
      if (!isParserRecord(value)) {
        unmapped.push(`Project item ${index + 1} could not be read.`);
        return;
      }
      const title = parserString(value.title);
      const description = parserString(value.description);
      const technologies = stringList(value.technologies);
      if (!title && !description && technologies.length === 0) return;
      const isHackathon = /\bhackathon\b/i.test(`${title} ${description}`);
      const type = isHackathon ? 'hackathon' : 'project';
      const name = isHackathon ? title : '';
      const projectTitle = isHackathon ? '' : title;
      const duplicate = profile.hackathons.some((item) =>
        item.type === type &&
        item.name.trim().toLowerCase() === name.toLowerCase() &&
        item.title.trim().toLowerCase() === projectTitle.toLowerCase() &&
        item.description.trim().toLowerCase() === description.toLowerCase()
      );
      if (!duplicate) {
        const project: HackathonProjectRecord = {
          id: profileId('project', index),
          type,
          name,
          title: projectTitle,
          description,
          technologies,
          dateOrYear: '',
        };
        profile.hackathons.push(project);
      }
    });
  }

  if (parsed.experience != null && !Array.isArray(parsed.experience)) {
    unmapped.push('Experience was returned in an unsupported format; review the parser output before adding it manually.');
  }
  const experience = (Array.isArray(parsed.experience) ? parsed.experience : [])
    .map(toExperience);
  experience.forEach((item, index) => {
    if (!item) unmapped.push(`Experience item ${index + 1} could not be read and was not added.`);
    if (!item) return;
    const description = [item.duration, item.description].filter(Boolean).join(' — ');
    const duplicate = profile.internships.some((existing) =>
      existing.company.trim().toLowerCase() === item.company.toLowerCase() &&
      existing.role.trim().toLowerCase() === item.role.toLowerCase() &&
      existing.description.trim().toLowerCase() === description.toLowerCase()
    );
    if (duplicate) return;
    profile.internships.push({
      id: profileId('internship', index),
      company: item.company,
      role: item.role,
      startDate: '',
      endDate: '',
      isOngoing: false,
      description,
      technologies: item.technologies,
    });
  });

  if (parsed.certifications != null && !Array.isArray(parsed.certifications)) {
    unmapped.push('Certifications were returned in an unsupported format and were not added.');
  } else {
    (parsed.certifications ?? []).forEach((value, index) => {
      const name = parserString(value);
      if (!name) {
        if (value != null) unmapped.push(`Certification item ${index + 1} was not a readable text name.`);
        return;
      }
      const duplicate = profile.certifications.some((item) =>
        item.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (!duplicate) {
        const certification: CertificationRecord = {
          id: profileId('certification', index),
          name,
          issuingOrg: /^Cisco\b/i.test(name) ? 'Cisco' : '',
          issueYear: '',
          credentialUrl: '',
        };
        profile.certifications.push(certification);
      }
    });
  }

  profile.cvFile = current.cvFile
    ? { ...current.cvFile, fileName: selectedFileName }
    : null;

  return {
    profile,
    conflicts,
    unmapped,
    experience: experience.filter((item): item is UnmappedExperience => item !== null),
  };
}
