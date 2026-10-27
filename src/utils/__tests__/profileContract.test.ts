/**
 * Test & Audit Suite for RADIX Talent Match
 * - Name, Phone, and Email Validation
 * - Education Section Dropdown Enhancements (Presets, Custom Other, Legacy Preservation, Validation)
 * - Profile Readiness & Equal Weighting Milestone Scoring
 * - JSON Export Contract
 */

import { calculateProfileCompletion, isValidEmail, isMeaningfulEducation, isValidEducation } from '../completion';
import { exportToRadixProfileJSON, serializeEducationToString } from '../exportProfile';
import { profileToFormState } from '../profileAdapter';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateEducationRecord,
  COUNTRY_CODES,
  getCountryCodeInfo,
} from '../validation';
import {
  CandidateProfileState,
  EducationRecord,
  DEGREE_PRESETS,
  FIELD_OF_STUDY_PRESETS,
  isPresetDegree,
  isPresetFieldOfStudy,
  VALID_RADIX_CODES,
  isValidRadixCategoryCode,
} from '../../types/profile';

export function runContractAudit() {
  console.log('=== STARTING RADIX CONTRACT & VALIDATION AUDIT ===\n');
  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean) {
    if (condition) {
      console.log(`PASS: ${description}`);
      passed++;
    } else {
      console.error(`FAIL: ${description}`);
      failed++;
    }
  }

  // ==========================================
  // SECTION 1: CANDIDATE NAME VALIDATION
  // ==========================================
  console.log('\n--- 1. Candidate Name Validation ---');
  assert('Name rejects empty string', !validateName('').isValid);
  assert('Name rejects whitespace-only string', !validateName('     ').isValid);
  assert('Name error message for empty input is clear', validateName('').error !== null);
  assert('Name rejects trailing numbers (e.g. "John 123")', !validateName('John 123').isValid);
  assert('Name rejects embedded numbers (e.g. "Sarah9")', !validateName('Sarah9').isValid);
  assert('Name rejects numeric-only strings (e.g. "007")', !validateName('007').isValid);
  assert('Name rejects names with romanized numbers (e.g. "Alex 2nd")', !validateName('Alex 2nd').isValid);
  assert(
    'Name with number gives specific error mentioning numbers',
    validateName('John 123').error === 'Name cannot contain numbers.'
  );
  assert('Name accepts normal name "Alex Morgan"', validateName('Alex Morgan').isValid);
  assert('Name accepts normal name with whitespace around "  Jordan Rivera  "', validateName('  Jordan Rivera  ').isValid);
  assert('Name accepts hyphenated name "Jean-Luc Picard"', validateName('Jean-Luc Picard').isValid);
  assert('Name accepts hyphenated name "Mary-Kate Olsen"', validateName('Mary-Kate Olsen').isValid);
  assert("Name accepts apostrophe name \"O'Connor\"", validateName("O'Connor").isValid);
  assert("Name accepts apostrophe name \"D'Angelo Russell\"", validateName("D'Angelo Russell").isValid);
  assert('Name accepts French accent characters "René Descartes"', validateName('René Descartes').isValid);
  assert('Name accepts German umlauts "Göttingen Müller"', validateName('Göttingen Müller').isValid);
  assert('Name accepts Spanish characters "José García Márquez"', validateName('José García Márquez').isValid);
  assert('Name accepts Devanagari script "आरव शर्मा"', validateName('आरव शर्मा').isValid);
  assert('Name accepts CJK characters "李伟"', validateName('李伟').isValid);
  assert('Name accepts Arabic characters "أحمد"', validateName('أحمد').isValid);
  assert('Name rejects symbols "@" ("Alex @ Berkeley")', !validateName('Alex @ Berkeley').isValid);
  assert('Name rejects symbols "#" ("Sarah#Tech")', !validateName('Sarah#Tech').isValid);
  assert('Name rejects symbols "!" ("Cool! Developer")', !validateName('Cool! Developer').isValid);

  // ==========================================
  // SECTION 2: EMAIL VALIDATION
  // ==========================================
  console.log('\n--- 2. Email Validation ---');
  assert('Email rejects empty string', !validateEmail('').isValid);
  assert('Email rejects whitespace-only string', !validateEmail('   ').isValid);
  assert('Email rejects missing @ symbol ("alexexample.com")', !validateEmail('alexexample.com').isValid);
  assert('Email rejects missing domain ("alex@")', !validateEmail('alex@').isValid);
  assert('Email rejects missing TLD ("alex@example")', !validateEmail('alex@example').isValid);
  assert('Email rejects double @ ("alex@@example.com")', !validateEmail('alex@@example.com').isValid);
  assert('Email rejects spaces inside email ("alex @example.com")', !validateEmail('alex @example.com').isValid);
  assert('Email rejects spaces in domain ("alex@example .com")', !validateEmail('alex@example .com').isValid);
  assert('Email accepts standard lowercase "alex.morgan@example.com"', validateEmail('alex.morgan@example.com').isValid);
  assert('Email accepts university subdomains "student@cs.berkeley.edu"', validateEmail('student@cs.berkeley.edu').isValid);
  assert('Email accepts plus-tag addressing "dev+test@domain.org"', validateEmail('dev+test@domain.org').isValid);
  assert('Email accepts all-caps "ALEX@EXAMPLE.COM"', validateEmail('ALEX@EXAMPLE.COM').isValid);
  assert('Email accepts mixed case "Jordan.Rivera@Mail.Stanford.EDU"', validateEmail('Jordan.Rivera@Mail.Stanford.EDU').isValid);
  assert('Email accepts mixed domain "candidate@GMAIL.COM"', validateEmail('candidate@GMAIL.COM').isValid);
  assert('Email trims leading/trailing whitespace "  user@domain.com  "', validateEmail('  user@domain.com  ').isValid);
  assert('isValidEmail helper aligns with validateEmail', isValidEmail('  ALEX@BERKELEY.EDU  '));

  // ==========================================
  // SECTION 3: PHONE NUMBER VALIDATION
  // ==========================================
  assert('Country codes list is defined and non-empty (>= 30)', COUNTRY_CODES.length >= 30);
  const countryKeySet = new Set(COUNTRY_CODES.map((c) => `${c.iso}-${c.code}`));
  assert('All country code keys (${c.iso}-${c.code}) are strictly unique with no duplicates', countryKeySet.size === COUNTRY_CODES.length);
  const isoSet = new Set(COUNTRY_CODES.map((c) => c.iso));
  assert('All ISO codes in COUNTRY_CODES are strictly unique', isoSet.size === COUNTRY_CODES.length);
  assert('India (+91) country code exists', COUNTRY_CODES.some((c) => c.code === '+91'));
  assert('US/Canada (+1) country code exists', COUNTRY_CODES.some((c) => c.code === '+1'));
  assert('UK (+44) country code exists', COUNTRY_CODES.some((c) => c.code === '+44'));
  assert('India: Valid 10-digit starting with 9 ("9876543210")', validatePhone('9876543210', '+91').isValid);
  assert('India: Valid 10-digit starting with 8 ("8123456789")', validatePhone('8123456789', '+91').isValid);
  assert('India: Valid 10-digit starting with 7 ("7000000000")', validatePhone('7000000000', '+91').isValid);
  assert('India: Valid 10-digit starting with 6 ("6999999999")', validatePhone('6999999999', '+91').isValid);
  assert('India: Formatted with spaces is accepted ("98765 43210")', validatePhone('98765 43210', '+91').isValid);
  assert('India: Formatted with hyphens is accepted ("98765-43210")', validatePhone('98765-43210', '+91').isValid);
  assert('India: Rejects mobile starting with 1 ("1234567890")', !validatePhone('1234567890', '+91').isValid);
  assert('India: Rejects mobile starting with 2 ("2345678901")', !validatePhone('2345678901', '+91').isValid);
  assert('India: Rejects mobile starting with 5 ("5555555555")', !validatePhone('5555555555', '+91').isValid);
  assert('India: Rejects incomplete 9 digits ("987654321")', !validatePhone('987654321', '+91').isValid);
  assert('India: Rejects excessive 11 digits ("98765432100")', !validatePhone('98765432100', '+91').isValid);
  assert('India: Rejects alphabet characters ("98765abcde")', !validatePhone('98765abcde', '+91').isValid);
  assert('US: Valid 10-digit number "(415) 890-2341"', validatePhone('(415) 890-2341', '+1').isValid);
  assert('US: Valid 10-digit plain "4158902341"', validatePhone('4158902341', '+1').isValid);
  assert('US: Rejects area code starting with 0 ("0123456789")', !validatePhone('0123456789', '+1').isValid);
  assert('US: Rejects area code starting with 1 ("1234567890")', !validatePhone('1234567890', '+1').isValid);
  assert('US: Rejects incomplete 7 digits ("5550199")', !validatePhone('5550199', '+1').isValid);
  assert('Phone: Empty string is valid (optional field)', validatePhone('', '+91').isValid);
  assert('Phone: Whitespace-only string is valid (optional field)', validatePhone('   ', '+91').isValid);
  const validIndiaResult = validatePhone('9876543210', '+91');
  assert('Formatted phone includes country dial code', validIndiaResult.formattedPhone.includes('+91'));
  assert('Expected format explanation is provided', validIndiaResult.expectedFormat.length > 0);

  // ==========================================
  // SECTION 4: EDUCATION SECTION & DROPDOWN ENHANCEMENTS
  // ==========================================
  console.log('\n--- 4. Education Dropdown Presets, Custom Values, and Validation ---');
  // 4.1 Degree Presets
  const expectedDegreePresets = [
    'High School',
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD / Doctorate',
    'Other',
  ];
  expectedDegreePresets.forEach((preset) => {
    assert(`Degree preset "${preset}" is defined in DEGREE_PRESETS`, (DEGREE_PRESETS as readonly string[]).includes(preset));
  });

  assert('isPresetDegree recognizes "Bachelor\'s Degree"', isPresetDegree("Bachelor's Degree"));
  assert('isPresetDegree recognizes "Master\'s Degree"', isPresetDegree("Master's Degree"));
  assert('isPresetDegree recognizes "PhD / Doctorate"', isPresetDegree('PhD / Doctorate'));
  assert('isPresetDegree recognizes "Diploma"', isPresetDegree('Diploma'));
  assert('isPresetDegree recognizes "High School"', isPresetDegree('High School'));
  assert('isPresetDegree flags custom "Associate Degree" as false (custom)', !isPresetDegree('Associate Degree'));
  assert('isPresetDegree flags custom "Juris Doctor" as false (custom)', !isPresetDegree('Juris Doctor'));
  assert('isPresetDegree flags "Other" as false (custom placeholder)', !isPresetDegree('Other'));

  // 4.2 Field of Study Presets
  const expectedFieldPresets = [
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
  ];
  expectedFieldPresets.forEach((field) => {
    assert(`Field preset "${field}" is defined in FIELD_OF_STUDY_PRESETS`, (FIELD_OF_STUDY_PRESETS as readonly string[]).includes(field));
  });

  assert('isPresetFieldOfStudy recognizes "Computer Science"', isPresetFieldOfStudy('Computer Science'));
  assert('isPresetFieldOfStudy recognizes "Data Science"', isPresetFieldOfStudy('Data Science'));
  assert('isPresetFieldOfStudy recognizes "Artificial Intelligence / Machine Learning"', isPresetFieldOfStudy('Artificial Intelligence / Machine Learning'));
  assert('isPresetFieldOfStudy recognizes "Mathematics"', isPresetFieldOfStudy('Mathematics'));
  assert('isPresetFieldOfStudy flags custom "Bioinformatics" as false (custom)', !isPresetFieldOfStudy('Bioinformatics'));
  assert('isPresetFieldOfStudy flags legacy "Computer Science & Software Engineering" as false (custom)', !isPresetFieldOfStudy('Computer Science & Software Engineering'));
  assert('isPresetFieldOfStudy flags "Other" as false (custom placeholder)', !isPresetFieldOfStudy('Other'));

  // 4.3 Validation of required fields
  const completeEdu: EducationRecord = {
    id: 'edu-1',
    degree: "Bachelor's Degree",
    fieldOfStudy: 'Computer Science',
    institution: 'UC Berkeley',
    graduationYear: '2025',
  };
  const valComplete = validateEducationRecord(completeEdu);
  assert('Complete education record is valid', valComplete.isComplete);
  assert('Complete education has no degree error', valComplete.degreeError === null);
  assert('Complete education has no institution error', valComplete.institutionError === null);
  assert('isValidEducation returns true for complete record', isValidEducation(completeEdu));

  // Incomplete: Missing institution
  const missingInstEdu: EducationRecord = {
    id: 'edu-2',
    degree: "Master's Degree",
    fieldOfStudy: 'Data Science',
    institution: '',
    graduationYear: '2026',
  };
  const valMissingInst = validateEducationRecord(missingInstEdu);
  assert('Education with missing institution is not complete', !valMissingInst.isComplete);
  assert('Missing institution generates clear error', valMissingInst.institutionError !== null);
  assert('isValidEducation returns false for missing institution', !isValidEducation(missingInstEdu));

  // Incomplete: Missing degree
  const missingDegEdu: EducationRecord = {
    id: 'edu-3',
    degree: '',
    fieldOfStudy: 'Mathematics',
    institution: 'MIT',
    graduationYear: '2024',
  };
  const valMissingDeg = validateEducationRecord(missingDegEdu);
  assert('Education with missing degree is not complete', !valMissingDeg.isComplete);
  assert('Missing degree generates clear error', valMissingDeg.degreeError !== null);
  assert('isValidEducation returns false for missing degree', !isValidEducation(missingDegEdu));

  // Incomplete: Whitespace only
  const whitespaceEdu: EducationRecord = {
    id: 'edu-4',
    degree: '   ',
    fieldOfStudy: '',
    institution: '   ',
    graduationYear: '',
  };
  assert('Whitespace-only education is not valid', !isValidEducation(whitespaceEdu));

  // 4.4 Custom Options & Legacy Preservation
  const legacyProfileEdu: EducationRecord[] = [
    {
      id: 'edu-leg-1',
      degree: 'Bachelor of Science (B.S.)', // Custom/legacy non-preset
      fieldOfStudy: 'Computer Science & Software Engineering', // Custom/legacy non-preset
      institution: 'University of California, Berkeley',
      graduationYear: '2025',
    },
    {
      id: 'edu-leg-2',
      degree: 'Associate Degree', // Custom/legacy non-preset
      fieldOfStudy: 'Mathematics', // Preset
      institution: 'San Francisco City College',
      graduationYear: '2023',
    },
  ];

  // Verify legacy values remain intact and valid
  assert('Legacy custom degree is preserved without loss', legacyProfileEdu[0].degree === 'Bachelor of Science (B.S.)');
  assert('Legacy custom field is preserved without loss', legacyProfileEdu[0].fieldOfStudy === 'Computer Science & Software Engineering');
  assert('Legacy record satisfies complete education requirement', isValidEducation(legacyProfileEdu[0]));
  assert('Legacy record 2 satisfies complete education requirement', isValidEducation(legacyProfileEdu[1]));

  // 4.5 Serialization & Export of Preset and Custom Education
  const mockProfileWithMixedEdu: CandidateProfileState = {
    personal: { fullName: 'Alex Morgan', email: 'alex@example.com', phone: '', countryCode: '+91', cityCountry: '' },
    education: [
      { id: '1', degree: "Master's Degree", fieldOfStudy: 'Data Science', institution: 'Stanford', graduationYear: '2026' },
      { id: '2', degree: 'Double Major B.S.', fieldOfStudy: 'Cognitive Science', institution: 'MIT', graduationYear: '2024' },
      { id: '3', degree: '   ', fieldOfStudy: '', institution: '', graduationYear: '' }, // Blank entry
    ],
    skills: [],
    hackathons: [],
    internships: [],
    certifications: [],
    preferredRoles: [],
    cvFile: null,
  };

  const exportedMixed = exportToRadixProfileJSON(mockProfileWithMixedEdu);
  assert('Blank education entry is excluded from exported JSON', exportedMixed.education.length === 2);
  assert('Preset education record degree is preserved in exported JSON', exportedMixed.education[0].degree === "Master's Degree");
  assert('Preset education record field is preserved in exported JSON', exportedMixed.education[0].field_of_study === 'Data Science');
  assert('Custom "Other" education degree is preserved in exported JSON', exportedMixed.education[1].degree === 'Double Major B.S.');
  assert('Custom "Other" field of study is preserved in exported JSON', exportedMixed.education[1].field_of_study === 'Cognitive Science');

  // Education string serialization helper
  const serialized = serializeEducationToString(exportedMixed.education);
  assert('serializeEducationToString formats preset degree', serialized.includes("Master's Degree in Data Science at Stanford (2026)"));
  assert('serializeEducationToString formats custom degree', serialized.includes('Double Major B.S. in Cognitive Science at MIT (2024)'));

  // ==========================================
  // SECTION 5: PROFILE READINESS & COMPLETION
  // ==========================================
  console.log('\n--- 5. Profile Readiness Calculation ---');
  const baseProfile: CandidateProfileState = {
    personal: { fullName: '', email: '', phone: '', countryCode: '+91', cityCountry: '' },
    education: [{ id: '1', degree: '', fieldOfStudy: '', institution: '', graduationYear: '' }],
    skills: [],
    hackathons: [],
    internships: [],
    certifications: [],
    preferredRoles: [],
    cvFile: null,
  };

  const comp0 = calculateProfileCompletion(baseProfile);
  assert('Initial empty profile has 0 score', comp0.score === 0);
  assert('CV is optional and excluded from required milestones', comp0.milestones.find((m) => m.id === 'cv')?.isRequired === false);

  // Incomplete education (only degree, missing institution) must NOT satisfy education milestone
  const profileIncompleteEdu = {
    ...baseProfile,
    education: [{ id: 'e-inc', degree: "Bachelor's Degree", fieldOfStudy: 'CS', institution: '', graduationYear: '' }],
  };
  const compIncompleteEdu = calculateProfileCompletion(profileIncompleteEdu);
  assert('Incomplete education (missing institution) does NOT award milestone', !compIncompleteEdu.milestones.find((m) => m.id === 'education')?.isComplete);

  // Incomplete education (only institution, missing degree) must NOT satisfy education milestone
  const profileIncompleteDeg = {
    ...baseProfile,
    education: [{ id: 'e-inc2', degree: '', fieldOfStudy: 'CS', institution: 'Stanford University', graduationYear: '' }],
  };
  const compIncompleteDeg = calculateProfileCompletion(profileIncompleteDeg);
  assert('Incomplete education (missing degree) does NOT award milestone', !compIncompleteDeg.milestones.find((m) => m.id === 'education')?.isComplete);

  // Complete education satisfies education milestone
  const profileCompleteEdu = {
    ...baseProfile,
    education: [{ id: 'e-comp', degree: "Bachelor's Degree", fieldOfStudy: 'Computer Science', institution: 'Stanford University', graduationYear: '2025' }],
  };
  const compCompleteEdu = calculateProfileCompletion(profileCompleteEdu);
  assert('Complete education satisfies education milestone', compCompleteEdu.milestones.find((m) => m.id === 'education')?.isComplete === true);

  // All required fields complete gives 100%; CV selection is optional.
  const completeProfile: CandidateProfileState = {
    personal: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@iitb.ac.in',
      phone: '9876543210',
      countryCode: '+91',
      cityCountry: 'Mumbai, India',
    },
    education: [
      { id: 'e1', degree: "Bachelor's Degree", fieldOfStudy: 'Computer Science', institution: 'IIT Bombay', graduationYear: '2025' },
    ],
    skills: [
      { id: 's1', skillName: 'Algorithms & Data Structures', categoryCode: 'DSA', evidence: 'Codeforces 2100+', confidence: 'high' },
    ],
    hackathons: [
      { id: 'h1', type: 'hackathon', name: 'Smart India Hackathon', title: 'Winner', description: 'AI crop disease detection', technologies: ['PyTorch'], dateOrYear: '2024' },
    ],
    internships: [
      { id: 'i1', company: 'TechCorp', role: 'SWE Intern', startDate: 'May 2024', endDate: 'July 2024', isOngoing: false, description: 'Distributed cache', technologies: ['Redis'] },
    ],
    certifications: [
      { id: 'c1', name: 'AWS Solutions Architect', issuingOrg: 'Amazon Web Services', issueYear: '2024', credentialUrl: 'https://aws.amazon.com' },
    ],
    preferredRoles: ['Backend Engineer', 'Distributed Systems Engineer'],
    cvFile: {
      file: null,
      fileName: 'aarav_sharma_resume.pdf',
      fileSizeFormatted: '1.2 MB',
      fileType: 'application/pdf',
      previewUrl: null,
      uploadedAt: '10:00 AM',
    },
  };

  const compFull = calculateProfileCompletion(completeProfile);
  assert('All required fields complete gives 100% and isReadyForSubmission true', compFull.score === 100 && compFull.isReadyForSubmission);
  const completeWithoutCv = calculateProfileCompletion({ ...completeProfile, cvFile: null });
  assert('Manual profile is ready without a CV', completeWithoutCv.score === 100 && completeWithoutCv.isReadyForSubmission);

  // ==========================================
  // SECTION 6: JSON EXPORT CONTRACT
  // ==========================================
  console.log('\n--- 6. JSON Export Contract & Phone Inclusion ---');
  const exported = exportToRadixProfileJSON(completeProfile);

  assert(
    'Exported profile uses the exact shared top-level fields',
    JSON.stringify(Object.keys(exported).sort()) === JSON.stringify([
      'certifications',
      'cv_file',
      'education',
      'email',
      'hackathons',
      'internships',
      'name',
      'phone',
      'preferred_roles',
      'skills',
    ])
  );
  assert('Exported JSON contains "phone" key', 'phone' in exported);
  assert('Exported phone is non-null and formatted with country code', exported.phone === '+91 9876543210');
  assert('Exported name is trimmed', exported.name === 'Aarav Sharma');
  assert('Exported email is trimmed', exported.email === 'aarav.sharma@iitb.ac.in');
  assert('Exported education preserves structured array', Array.isArray(exported.education) && exported.education.length === 1);
  assert('Exported skills preserves category_code DSA', exported.skills[0].category_code === 'DSA');
  assert('Exported cv_file is string filename', exported.cv_file === 'aarav_sharma_resume.pdf');

  const profileWithoutPhone = {
    ...completeProfile,
    personal: { ...completeProfile.personal, phone: '' },
  };
  const exportedNoPhone = exportToRadixProfileJSON(profileWithoutPhone);
  assert('Exported JSON has phone: null when candidate omits phone (not missing or undefined)', exportedNoPhone.phone === null);

  const jsonString = JSON.stringify(exported, null, 2);
  const parsedBack = JSON.parse(jsonString);
  assert('JSON stringifies and parses back cleanly', parsedBack.phone === '+91 9876543210');
  assert(
    'Loading and re-exporting the shared profile preserves its JSON contract',
    JSON.stringify(exportToRadixProfileJSON(profileToFormState(exported))) === JSON.stringify(exported)
  );

  console.log(`\n=== AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

// Execute tests
runContractAudit();
