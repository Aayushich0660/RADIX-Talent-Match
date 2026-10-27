import { RadixCategoryCode, SkillConfidence } from '../types/profile';

export interface ParsedResumeSkill {
  skill_name?: unknown;
  category_code?: unknown;
  evidence?: unknown;
  confidence?: unknown;
}

export interface ParsedResumeEducation {
  institution?: unknown;
  degree?: unknown;
  field?: unknown;
  start_year?: unknown;
  end_year?: unknown;
  cgpa?: unknown;
  grade?: unknown;
}

export interface ParsedResumeProject {
  title?: unknown;
  description?: unknown;
  technologies?: unknown;
}

export interface ParsedResumeExperience {
  company?: unknown;
  role?: unknown;
  duration?: unknown;
  description?: unknown;
  technologies?: unknown;
}

export interface ParsedResume {
  source_type: 'resume';
  source_file?: unknown;
  candidate?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
  skills: ParsedResumeSkill[];
  education?: ParsedResumeEducation[] | null;
  projects?: ParsedResumeProject[] | null;
  experience?: ParsedResumeExperience[] | null;
  certifications?: unknown[] | null;
  preferred_roles?: unknown[] | null;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const CATEGORY_CODES: readonly RadixCategoryCode[] = [
  'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD',
  'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER',
];
const CONFIDENCE_LEVELS: readonly SkillConfidence[] = ['high', 'medium', 'low'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(body: unknown, status: number): string {
  const detail = isRecord(body) ? body.detail : undefined;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      if (!isRecord(item)) return String(item);
      const location = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
      return `${location ? `${location}: ` : ''}${String(item.msg ?? 'Invalid request')}`;
    }).join(' ');
  }
  return `Resume parsing failed (HTTP ${status}). You can continue entering the profile manually.`;
}

function isParsedResume(value: unknown): value is ParsedResume {
  return isRecord(value) &&
    value.source_type === 'resume' &&
    Array.isArray(value.skills) &&
    (value.candidate === undefined || value.candidate === null || isRecord(value.candidate));
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  if (!/\.(pdf|docx)$/i.test(file.name)) {
    throw new Error('Choose a PDF (.pdf) or Word document (.docx).');
  }
  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('The file exceeds the 10 MB maximum size limit.');
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  let response: Response;
  try {
    response = await fetch('/parser/parse-resume', { method: 'POST', body: formData });
  } catch {
    throw new Error('Could not reach the resume parser. Check that the parser service is running on port 8002.');
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    if (!response.ok && response.status >= 500) {
      throw new Error('Could not reach the resume parser. Check that the parser service is running on port 8002.');
    }
    throw new Error('The resume parser returned an invalid response. You can continue entering the profile manually.');
  }

  if (!responseText && response.ok) {
    throw new Error('The resume parser returned an invalid response. You can continue entering the profile manually.');
  }
  if (!responseText && response.status >= 500) {
    throw new Error('Could not reach the resume parser. Check that the parser service is running on port 8002.');
  }

  let body: unknown;
  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error('The resume parser returned an invalid response. You can continue entering the profile manually.');
      }
    }
  }
  if (!response.ok) {
    throw new Error(errorMessage(body, response.status));
  }
  if (!isParsedResume(body)) {
    throw new Error('The resume parser response did not match the expected format. You can continue entering the profile manually.');
  }
  return body;
}

export function isParserCategoryCode(value: unknown): value is RadixCategoryCode {
  return typeof value === 'string' && CATEGORY_CODES.includes(value as RadixCategoryCode);
}

export function isParserConfidence(value: unknown): value is SkillConfidence {
  return typeof value === 'string' && CONFIDENCE_LEVELS.includes(value as SkillConfidence);
}

export function isParserRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export function parserString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
