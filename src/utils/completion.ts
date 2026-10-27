import { CandidateProfileState, isValidRadixCategoryCode } from '../types/profile';
import { validateName, validateEmail } from './validation';

export interface MilestoneItem {
  id: string;
  label: string;
  isComplete: boolean;
  isRequired: boolean;
  hint: string;
}

export interface ProfileCompletionResult {
  score: number; // 0 - 100
  milestones: MilestoneItem[];
  completedCount: number;
  totalRequiredCount: number;
  isReadyForSubmission: boolean;
  enrichmentStats: {
    skillsCount: number;
    hackathonsCount: number;
    internshipsCount: number;
    certificationsCount: number;
    preferredRolesCount: number;
  };
}

/**
 * Validates email according to standard format.
 * Trims surrounding whitespace before evaluating.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Determines whether an education record contains meaningful content
 * (at minimum, a degree, qualification, or institution name).
 * Used for draft filtering in JSON export so partial records are not lost.
 */
export function isMeaningfulEducation(edu: {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
}): boolean {
  return Boolean(
    (edu.degree && edu.degree.trim().length > 0) ||
    (edu.institution && edu.institution.trim().length > 0) ||
    (edu.fieldOfStudy && edu.fieldOfStudy.trim().length > 0)
  );
}

/**
 * Determines whether an education record satisfies all required fields:
 * Both Degree/Qualification and Institution/University must be non-empty after trimming.
 */
export function isValidEducation(edu: {
  degree?: string;
  institution?: string;
}): boolean {
  return Boolean(
    edu.degree &&
    edu.degree.trim().length > 0 &&
    edu.institution &&
    edu.institution.trim().length > 0
  );
}

/**
 * Calculates profile completion from actual form state.
 *
 * The five required profile fields:
 * 1. Full name entered (non-empty after trim)
 * 2. Valid email entered (proper format after trim)
 * 3. At least one complete education record (both degree and institution)
 * 4. At least one valid skill (non-empty name & permitted RADIX category)
 * 5. At least one preferred role
 * CV selection is optional and does not block profile readiness.
 *
 * Each required milestone counts equally toward the completion percentage.
 */
export function calculateProfileCompletion(state: CandidateProfileState): ProfileCompletionResult {
  const hasValidName = validateName(state.personal.fullName).isValid;
  const hasValidEmail = validateEmail(state.personal.email).isValid;
  const hasValidEducation = state.education.some((edu) => isValidEducation(edu));
  const hasSkills = state.skills.some(
    (s) => s.skillName.trim().length > 0 && isValidRadixCategoryCode(s.categoryCode)
  );
  const hasRoles = state.preferredRoles.filter((r) => r.trim().length > 0).length >= 1;
  const hasCv = state.cvFile !== null && Boolean(state.cvFile.fileName && state.cvFile.fileName.trim());

  const milestones: MilestoneItem[] = [
    {
      id: 'name',
      label: 'Full Name',
      isComplete: hasValidName,
      isRequired: true,
      hint: 'Enter your non-empty full name',
    },
    {
      id: 'email',
      label: 'Valid Email Address',
      isComplete: hasValidEmail,
      isRequired: true,
      hint: 'Provide a valid reachable email address',
    },
    {
      id: 'education',
      label: 'Education Record',
      isComplete: hasValidEducation,
      isRequired: true,
      hint: 'Add at least one meaningful qualification or institution',
    },
    {
      id: 'skills',
      label: 'Technical Skills (at least 1)',
      isComplete: hasSkills,
      isRequired: true,
      hint: 'Add at least one skill categorized with a valid RADIX code',
    },
    {
      id: 'roles',
      label: 'Preferred Job Roles',
      isComplete: hasRoles,
      isRequired: true,
      hint: 'Select or add at least one preferred job position',
    },
    {
      id: 'cv',
      label: 'CV (optional)',
      isComplete: hasCv,
      isRequired: false,
      hint: 'Optional: select a PDF or DOCX for a local preview; upload and parsing are not available yet',
    },
  ];

  const requiredMilestones = milestones.filter((milestone) => milestone.isRequired);
  const totalRequiredCount = requiredMilestones.length;
  const completedCount = requiredMilestones.filter((milestone) => milestone.isComplete).length;
  // Equal weighting: (completed / totalRequired) * 100
  const totalScore = Math.round((completedCount / totalRequiredCount) * 100);

  return {
    score: totalScore,
    milestones,
    completedCount,
    totalRequiredCount,
    isReadyForSubmission: completedCount === totalRequiredCount,
    enrichmentStats: {
      skillsCount: state.skills.filter((s) => s.skillName.trim()).length,
      hackathonsCount: state.hackathons.filter((h) => h.name.trim() || h.title.trim() || h.description.trim()).length,
      internshipsCount: state.internships.filter((i) => i.company.trim() || i.role.trim() || i.description.trim()).length,
      certificationsCount: state.certifications.filter((c) => c.name.trim() || c.issuingOrg.trim()).length,
      preferredRolesCount: state.preferredRoles.filter((r) => r.trim()).length,
    },
  };
}
