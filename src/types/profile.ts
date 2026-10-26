export type RadixCategoryCode =
  | 'COD'
  | 'DSA'
  | 'OOD'
  | 'APTI'
  | 'COMM'
  | 'AI'
  | 'CLOUD'
  | 'SQL'
  | 'SWE'
  | 'SYSD'
  | 'NETW'
  | 'OS'
  | 'OTHER';

export const VALID_RADIX_CODES: readonly RadixCategoryCode[] = [
  'COD',
  'DSA',
  'OOD',
  'APTI',
  'COMM',
  'AI',
  'CLOUD',
  'SQL',
  'SWE',
  'SYSD',
  'NETW',
  'OS',
  'OTHER',
] as const;

export function isValidRadixCategoryCode(code: string): code is RadixCategoryCode {
  return VALID_RADIX_CODES.includes(code as RadixCategoryCode);
}

export type SkillConfidence = 'high' | 'medium' | 'low';

export interface SkillCategoryDefinition {
  code: RadixCategoryCode;
  label: string;
  description: string;
  badgeClass: string;
}

export const RADIX_SKILL_CATEGORIES: Record<RadixCategoryCode, SkillCategoryDefinition> = {
  COD: {
    code: 'COD',
    label: 'Coding',
    description: 'Programming languages, syntax, semantics & core algorithmic coding',
    badgeClass: 'bg-[#F0EEFA] text-[#4F46BA] border-[#DCD8F0]',
  },
  DSA: {
    code: 'DSA',
    label: 'Data Structures & Algorithms',
    description: 'Algorithmic complexity, tree/graph traversal, dynamic programming',
    badgeClass: 'bg-[#ECF7F2] text-[#1E7450] border-[#CCEADB]',
  },
  OOD: {
    code: 'OOD',
    label: 'Object-Oriented Design',
    description: 'OOP principles (SOLID), design patterns, and clean domain modeling',
    badgeClass: 'bg-[#F2EDFB] text-[#5A3896] border-[#DDD3F3]',
  },
  APTI: {
    code: 'APTI',
    label: 'Aptitude',
    description: 'Logical deduction, quantitative problem solving, and analytical reasoning',
    badgeClass: 'bg-[#FDF6E8] text-[#925B0B] border-[#F4E3BF]',
  },
  COMM: {
    code: 'COMM',
    label: 'Communication',
    description: 'Technical documentation, team collaboration, and client communication',
    badgeClass: 'bg-[#FBF0F4] text-[#9A3059] border-[#F2D1DF]',
  },
  AI: {
    code: 'AI',
    label: 'Artificial Intelligence',
    description: 'Machine learning, deep learning, NLP, computer vision & LLM workflows',
    badgeClass: 'bg-[#F0EEFA] text-[#5546C4] border-[#DCD8F0]',
  },
  CLOUD: {
    code: 'CLOUD',
    label: 'Cloud',
    description: 'Cloud platforms (AWS/GCP/Azure), containerization & serverless architectures',
    badgeClass: 'bg-[#EFF6FD] text-[#2563A6] border-[#D1E4FA]',
  },
  SQL: {
    code: 'SQL',
    label: 'SQL',
    description: 'Relational databases, indexing, schema design, and complex queries',
    badgeClass: 'bg-[#EEF7F6] text-[#1D746D] border-[#CFECE8]',
  },
  SWE: {
    code: 'SWE',
    label: 'Software Engineering',
    description: 'Git, unit/integration testing, CI/CD pipelines & clean architecture',
    badgeClass: 'bg-[#EFF8FA] text-[#1B6F84] border-[#CFECF2]',
  },
  SYSD: {
    code: 'SYSD',
    label: 'System Design',
    description: 'High-availability, distributed systems, caching, message brokers & partitioning',
    badgeClass: 'bg-[#F0EEFA] text-[#4F46BA] border-[#DCD8F0]',
  },
  NETW: {
    code: 'NETW',
    label: 'Networking',
    description: 'OSI layers, TCP/IP, HTTP/S, websockets, DNS & network security',
    badgeClass: 'bg-[#FAF2EB] text-[#9A5016] border-[#F2D7C2]',
  },
  OS: {
    code: 'OS',
    label: 'Operating Systems',
    description: 'Concurrency, multi-threading, virtual memory, Linux shells & POSIX',
    badgeClass: 'bg-[#F3F4F8] text-[#424658] border-[#DFE1EA]',
  },
  OTHER: {
    code: 'OTHER',
    label: 'Other',
    description: 'Auxiliary technical domains, developer tooling, or specialized tech stacks',
    badgeClass: 'bg-[#F5F4FA] text-[#55596D] border-[#E4E2EE]',
  },
};

export const RADIX_CATEGORY_LIST = Object.values(RADIX_SKILL_CATEGORIES);

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  countryCode?: string;
  cityCountry: string;
}

export const DEGREE_PRESETS = [
  'High School',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD / Doctorate',
  'Other',
] as const;

export type DegreePreset = (typeof DEGREE_PRESETS)[number];

export const FIELD_OF_STUDY_PRESETS = [
  'Computer Science',
  'Information Technology',
  'Data Science',
  'Artificial Intelligence / Machine Learning',
  'Electronics and Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Mathematics',
  'Physics',
  'Business / Management',
  'Other',
] as const;

export type FieldOfStudyPreset = (typeof FIELD_OF_STUDY_PRESETS)[number];

export function isPresetDegree(value: string): boolean {
  return (DEGREE_PRESETS as readonly string[]).filter((p) => p !== 'Other').includes(value.trim());
}

export function isPresetFieldOfStudy(value: string): boolean {
  return (FIELD_OF_STUDY_PRESETS as readonly string[]).filter((p) => p !== 'Other').includes(value.trim());
}

export interface EducationRecord {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
}

export interface SkillRecord {
  id: string;
  skillName: string;
  categoryCode: RadixCategoryCode;
  evidence: string;
  confidence?: SkillConfidence | '' | null;
}

export interface HackathonProjectRecord {
  id: string;
  type: 'hackathon' | 'project';
  name: string;
  title: string;
  description: string;
  technologies: string[];
  dateOrYear: string;
}

export interface InternshipRecord {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  description: string;
  technologies: string[];
}

export interface CertificationRecord {
  id: string;
  name: string;
  issuingOrg: string;
  issueYear: string;
  credentialUrl: string;
}

export interface CvFileState {
  file: File | null;
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  previewUrl: string | null;
  uploadedAt: string;
}

export interface CandidateProfileState {
  personal: PersonalInfo;
  education: EducationRecord[];
  skills: SkillRecord[];
  hackathons: HackathonProjectRecord[];
  internships: InternshipRecord[];
  certifications: CertificationRecord[];
  preferredRoles: string[];
  cvFile: CvFileState | null;
}

// RADIX Shared Schema Export definition
export interface RadixExportSkill {
  skill_name: string;
  category_code: RadixCategoryCode;
  evidence: string;
  confidence: SkillConfidence | null;
}

export interface RadixExportEducation {
  degree: string;
  field_of_study: string;
  institution: string;
  graduation_year: string;
}

export interface RadixExportHackathonProject {
  type: 'hackathon' | 'project';
  name: string;
  title: string;
  description: string;
  technologies: string[];
  date_or_year: string;
}

export interface RadixExportInternship {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  description: string;
  technologies: string[];
}

export interface RadixExportCertification {
  name: string;
  issuing_organization: string;
  issue_year: string;
  credential_url: string;
}

/**
 * Standard candidate profile JSON schema conforming to RADIX Hackathon contract.
 *
 * NOTE ON EDUCATION SCHEMA COMPATIBILITY:
 * The initial brief proposed `education` as a top-level field. Because applicants
 * frequently possess multiple qualifications (e.g. Associate + Bachelor's, or Dual Major),
 * our form preserves all records in a structured array `RadixExportEducation[]` to prevent
 * silent data loss. If downstream consumers require a single summary string, an adapter
 * can easily serialize this array without information degradation.
 */
export interface RadixExportProfile {
  name: string;
  email: string;
  phone: string | null;
  education: RadixExportEducation[];
  skills: RadixExportSkill[];
  hackathons: RadixExportHackathonProject[];
  internships: RadixExportInternship[];
  certifications: RadixExportCertification[];
  preferred_roles: string[];
  cv_file: string | null;
}
