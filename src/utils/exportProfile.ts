import {
  CandidateProfileState,
  RadixExportProfile,
  RadixExportEducation,
  RadixExportSkill,
  RadixExportHackathonProject,
  RadixExportInternship,
  RadixExportCertification,
  isValidRadixCategoryCode,
  RadixCategoryCode,
} from '../types/profile';
import { isMeaningfulEducation } from './completion';
import { validatePhone } from './validation';

/**
 * Transforms the in-memory React candidate profile state into the standard
 * RADIX Talent Match shared JSON schema.
 *
 * VALIDATION & CLEANING CONTRACT:
 * 1. Excludes internal React state (keys, temporary IDs, touched flags, browser File objects).
 * 2. Trims leading and trailing whitespace from all string fields.
 * 3. Filters out completely blank repeating records:
 *    - Education: Requires at least one non-empty academic field (degree, field of study, or institution).
 *    - Skills: Requires non-empty skill name and verifies RADIX category code against the 13 official taxonomy codes.
 *    - Hackathons/Projects: Excludes entries with empty name, title, and description.
 *    - Internships: Excludes entries with empty company, role, and description.
 *    - Certifications: Excludes entries with empty name and issuing organization.
 * 4. Normalizes skill confidence: Preserves 'high', 'medium', 'low', or null if unset.
 * 5. Formats cv_file as string filename or null (never a mock URL or File object).
 * 6. Preserves preferred_roles as string[].
 *
 * SCHEMA COMPATIBILITY NOTE (Education):
 * The preliminary hackathon brief proposed `education` as a top-level field.
 * In production career platforms, applicants frequently possess multiple qualifications
 * (e.g., dual degrees, transfer associate degrees, postgraduate diplomas).
 * To prevent silent data loss, this contract exports `education` as `RadixExportEducation[]`.
 * If downstream consumers require a single-string representation, `serializeEducationToString`
 * is provided below to facilitate frictionless downstream ingestion.
 */
export function exportToRadixProfileJSON(state: CandidateProfileState): RadixExportProfile {
  // 1. Clean and filter education records (remove completely blank entries)
  const education: RadixExportEducation[] = state.education
    .filter((edu) => isMeaningfulEducation(edu))
    .map((edu) => ({
      degree: edu.degree.trim(),
      field_of_study: edu.fieldOfStudy.trim(),
      institution: edu.institution.trim(),
      graduation_year: edu.graduationYear.trim(),
    }));

  // 2. Clean and filter technical skills
  const skills: RadixExportSkill[] = state.skills
    .filter((sk) => sk.skillName.trim().length > 0)
    .map((sk) => {
      // Validate category code against official RADIX taxonomy
      const categoryCode: RadixCategoryCode = isValidRadixCategoryCode(sk.categoryCode)
        ? sk.categoryCode
        : 'OTHER';

      return {
        skill_name: sk.skillName.trim(),
        category_code: categoryCode,
        evidence: sk.evidence ? sk.evidence.trim() : '',
        confidence: sk.confidence ? sk.confidence : null,
      };
    });

  // 3. Clean and filter hackathons & projects
  const hackathons: RadixExportHackathonProject[] = state.hackathons
    .filter((hp) => hp.name.trim() || hp.title.trim() || hp.description.trim())
    .map((hp) => ({
      type: hp.type === 'hackathon' ? 'hackathon' : 'project',
      name: hp.name.trim(),
      title: hp.title.trim(),
      description: hp.description.trim(),
      technologies: (hp.technologies || [])
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      date_or_year: hp.dateOrYear.trim(),
    }));

  // 4. Clean and filter internships & professional experience
  const internships: RadixExportInternship[] = state.internships
    .filter((item) => item.company.trim() || item.role.trim() || item.description.trim())
    .map((item) => ({
      company: item.company.trim(),
      role: item.role.trim(),
      start_date: item.startDate.trim(),
      end_date: item.isOngoing ? 'Present' : item.endDate.trim(),
      is_ongoing: Boolean(item.isOngoing),
      description: item.description.trim(),
      technologies: (item.technologies || [])
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    }));

  // 5. Clean and filter certifications
  const certifications: RadixExportCertification[] = state.certifications
    .filter((cert) => cert.name.trim() || cert.issuingOrg.trim())
    .map((cert) => ({
      name: cert.name.trim(),
      issuing_organization: cert.issuingOrg.trim(),
      issue_year: cert.issueYear.trim(),
      credential_url: cert.credentialUrl.trim(),
    }));

  // 6. Preferred roles array
  const preferred_roles = (state.preferredRoles || [])
    .map((role) => role.trim())
    .filter((role) => role.length > 0);

  // 7. CV attachment: filename string or null
  const cv_file = state.cvFile && state.cvFile.fileName && state.cvFile.fileName.trim()
    ? state.cvFile.fileName.trim()
    : null;

  // 8. Phone number: formatted with country code or null
  const rawPhone = state.personal.phone?.trim();
  let phone: string | null = null;
  if (rawPhone) {
    const phoneResult = validatePhone(rawPhone, state.personal.countryCode || '+91');
    phone = phoneResult.isValid && phoneResult.formattedPhone ? phoneResult.formattedPhone : rawPhone;
  }

  return {
    name: state.personal.fullName.trim(),
    email: state.personal.email.trim(),
    phone,
    education,
    skills,
    hackathons,
    internships,
    certifications,
    preferred_roles,
    cv_file,
  };
}

/**
 * Adapter helper that formats multiple education records into a single descriptive
 * string if downstream consumers strictly require a single 'education' field.
 */
export function serializeEducationToString(education: RadixExportEducation[]): string {
  if (education.length === 0) return '';
  return education
    .map((edu) => {
      const parts = [
        edu.degree,
        edu.field_of_study ? `in ${edu.field_of_study}` : null,
        edu.institution ? `at ${edu.institution}` : null,
        edu.graduation_year ? `(${edu.graduation_year})` : null,
      ].filter(Boolean);
      return parts.join(' ');
    })
    .join('; ');
}
