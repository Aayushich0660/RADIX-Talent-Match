import { CandidateProfileState, RadixExportProfile } from '../types/profile';
import { INITIAL_EMPTY_PROFILE } from './sampleData';
import { COUNTRY_CODES } from './validation';

export function profileToFormState(profile: RadixExportProfile): CandidateProfileState {
  const phone = profile.phone ?? '';
  const phoneCountry = COUNTRY_CODES
    .filter(({ code }) => phone.startsWith(code))
    .sort((left, right) => right.code.length - left.code.length)[0];

  return {
    ...INITIAL_EMPTY_PROFILE,
    personal: {
      fullName: profile.name,
      email: profile.email,
      phone: phoneCountry ? phone.slice(phoneCountry.code.length).trim() : phone,
      countryCode: phoneCountry?.code ?? '+91',
      cityCountry: profile.city_country ?? '',
    },
    education: profile.education.map((item, index) => ({
      id: `loaded-education-${Date.now()}-${index}`,
      degree: item.degree,
      fieldOfStudy: item.field_of_study,
      institution: item.institution,
      graduationYear: item.graduation_year,
      cgpa: item.cgpa ?? '',
    })),
    skills: profile.skills.map((item, index) => ({
      id: `loaded-skill-${Date.now()}-${index}`,
      skillName: item.skill_name,
      categoryCode: item.category_code,
      evidence: item.evidence,
      confidence: item.confidence ?? '',
    })),
    hackathons: profile.hackathons.map((item, index) => ({
      id: `loaded-project-${Date.now()}-${index}`,
      type: item.type,
      name: item.name,
      title: item.title,
      description: item.description,
      technologies: [...item.technologies],
      dateOrYear: item.date_or_year,
    })),
    internships: profile.internships.map((item, index) => ({
      id: `loaded-internship-${Date.now()}-${index}`,
      company: item.company,
      role: item.role,
      startDate: item.start_date,
      endDate: item.is_ongoing ? '' : item.end_date,
      isOngoing: item.is_ongoing,
      description: item.description,
      technologies: [...item.technologies],
    })),
    certifications: profile.certifications.map((item, index) => ({
      id: `loaded-certification-${Date.now()}-${index}`,
      name: item.name,
      issuingOrg: item.issuing_organization,
      issueYear: item.issue_year,
      credentialUrl: item.credential_url,
    })),
    preferredRoles: [...profile.preferred_roles],
    cvFile: profile.cv_file
      ? {
          file: null,
          fileName: profile.cv_file,
          fileSizeFormatted: 'File contents are not stored by the profile API',
          fileType: '',
          previewUrl: null,
          uploadedAt: 'Loaded from saved profile',
        }
      : null,
  };
}
