/**
 * Validation utilities for RADIX Talent Match Profile Builder
 *
 * Implements strict, readable validation for:
 * 1. Candidate Name (no numbers, permits international characters, spaces, hyphens, apostrophes)
 * 2. Country-aware Phone Number (validates digit lengths and rules per country code, e.g. India +91)
 * 3. Email Address (trimmed, case-insensitive RFC-standard validation)
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface CountryCodeInfo {
  code: string; // e.g. '+91'
  country: string; // e.g. 'India'
  iso: string; // e.g. 'IN'
  placeholder: string; // e.g. '98765 43210'
  minDigits: number;
  maxDigits: number;
  formatDescription: string;
  customValidator?: (digits: string) => { isValid: boolean; error: string | null };
}

export const COUNTRY_CODES: CountryCodeInfo[] = [
  {
    code: '+91',
    country: 'India',
    iso: 'IN',
    placeholder: '98765 43210',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 6, 7, 8, or 9 (e.g. 98765 43210)',
    customValidator: (digits) => {
      if (digits.length !== 10) {
        return {
          isValid: false,
          error: `Indian mobile number must be exactly 10 digits (currently ${digits.length}).`,
        };
      }
      if (!/^[6-9]/.test(digits)) {
        return {
          isValid: false,
          error: 'Indian mobile numbers must begin with 6, 7, 8, or 9.',
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+1',
    country: 'United States & Canada',
    iso: 'US',
    placeholder: '(415) 555-0199',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10-digit number with area code (e.g. 415 555 0199)',
    customValidator: (digits) => {
      if (digits.length !== 10) {
        return {
          isValid: false,
          error: `US/Canada phone number must be 10 digits (currently ${digits.length}).`,
        };
      }
      if (/^[01]/.test(digits)) {
        return {
          isValid: false,
          error: 'US/Canada area codes cannot begin with 0 or 1.',
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+44',
    country: 'United Kingdom',
    iso: 'GB',
    placeholder: '7911 123456',
    minDigits: 10,
    maxDigits: 11,
    formatDescription: '10 or 11 digits (e.g. 7911 123456)',
    customValidator: (digits) => {
      // Remove optional leading trunk 0 if present (e.g. 07911 -> 7911)
      const normalized = digits.startsWith('0') ? digits.slice(1) : digits;
      if (normalized.length !== 10) {
        return {
          isValid: false,
          error: `UK phone numbers must be 10 digits without leading 0 (currently ${normalized.length}).`,
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+61',
    country: 'Australia',
    iso: 'AU',
    placeholder: '412 345 678',
    minDigits: 9,
    maxDigits: 10,
    formatDescription: '9 digits without leading 0 (e.g. 412 345 678)',
  },
  {
    code: '+49',
    country: 'Germany',
    iso: 'DE',
    placeholder: '151 23456789',
    minDigits: 10,
    maxDigits: 11,
    formatDescription: '10 to 11 digits (e.g. 151 23456789)',
  },
  {
    code: '+33',
    country: 'France',
    iso: 'FR',
    placeholder: '6 12 34 56 78',
    minDigits: 9,
    maxDigits: 10,
    formatDescription: '9 digits without leading 0 (e.g. 6 12 34 56 78)',
  },
  {
    code: '+65',
    country: 'Singapore',
    iso: 'SG',
    placeholder: '8123 4567',
    minDigits: 8,
    maxDigits: 8,
    formatDescription: '8 digits starting with 8 or 9 (e.g. 8123 4567)',
    customValidator: (digits) => {
      if (digits.length !== 8) {
        return {
          isValid: false,
          error: `Singapore numbers must be exactly 8 digits (currently ${digits.length}).`,
        };
      }
      if (!/^[89]/.test(digits)) {
        return {
          isValid: false,
          error: 'Singapore mobile numbers must begin with 8 or 9.',
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+971',
    country: 'United Arab Emirates',
    iso: 'AE',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits starting with 5 (e.g. 50 123 4567)',
    customValidator: (digits) => {
      if (digits.length !== 9) {
        return {
          isValid: false,
          error: `UAE mobile numbers must be exactly 9 digits (currently ${digits.length}).`,
        };
      }
      if (!/^5/.test(digits)) {
        return {
          isValid: false,
          error: 'UAE mobile numbers must start with 5.',
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+966',
    country: 'Saudi Arabia',
    iso: 'SA',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits starting with 5 (e.g. 50 123 4567)',
  },
  {
    code: '+81',
    country: 'Japan',
    iso: 'JP',
    placeholder: '90 1234 5678',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits without leading 0 (e.g. 90 1234 5678)',
  },
  {
    code: '+86',
    country: 'China',
    iso: 'CN',
    placeholder: '138 0013 8000',
    minDigits: 11,
    maxDigits: 11,
    formatDescription: '11 digits starting with 1 (e.g. 138 0013 8000)',
    customValidator: (digits) => {
      if (digits.length !== 11) {
        return {
          isValid: false,
          error: `Chinese phone numbers must be 11 digits (currently ${digits.length}).`,
        };
      }
      if (!/^1/.test(digits)) {
        return {
          isValid: false,
          error: 'Chinese mobile numbers must start with 1.',
        };
      }
      return { isValid: true, error: null };
    },
  },
  {
    code: '+55',
    country: 'Brazil',
    iso: 'BR',
    placeholder: '11 91234 5678',
    minDigits: 10,
    maxDigits: 11,
    formatDescription: '10 or 11 digits including area code (e.g. 11 91234 5678)',
  },
  {
    code: '+234',
    country: 'Nigeria',
    iso: 'NG',
    placeholder: '803 123 4567',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits without leading 0 (e.g. 803 123 4567)',
  },
  {
    code: '+27',
    country: 'South Africa',
    iso: 'ZA',
    placeholder: '71 123 4567',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits without leading 0 (e.g. 71 123 4567)',
  },
  {
    code: '+92',
    country: 'Pakistan',
    iso: 'PK',
    placeholder: '300 1234567',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 3 (e.g. 300 1234567)',
  },
  {
    code: '+880',
    country: 'Bangladesh',
    iso: 'BD',
    placeholder: '1712 345678',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 1 (e.g. 1712 345678)',
  },
  {
    code: '+63',
    country: 'Philippines',
    iso: 'PH',
    placeholder: '917 123 4567',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 9 (e.g. 917 123 4567)',
  },
  {
    code: '+31',
    country: 'Netherlands',
    iso: 'NL',
    placeholder: '6 12345678',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits without leading 0 (e.g. 6 12345678)',
  },
  {
    code: '+353',
    country: 'Ireland',
    iso: 'IE',
    placeholder: '87 123 4567',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits without leading 0 (e.g. 87 123 4567)',
  },
  {
    code: '+41',
    country: 'Switzerland',
    iso: 'CH',
    placeholder: '79 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits without leading 0 (e.g. 79 123 45 67)',
  },
  {
    code: '+34',
    country: 'Spain',
    iso: 'ES',
    placeholder: '612 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits (e.g. 612 34 56 78)',
  },
  {
    code: '+39',
    country: 'Italy',
    iso: 'IT',
    placeholder: '312 345 6789',
    minDigits: 9,
    maxDigits: 10,
    formatDescription: '9 to 10 digits (e.g. 312 345 6789)',
  },
  {
    code: '+82',
    country: 'South Korea',
    iso: 'KR',
    placeholder: '10 1234 5678',
    minDigits: 9,
    maxDigits: 10,
    formatDescription: '9 to 10 digits without leading 0 (e.g. 10 1234 5678)',
  },
  {
    code: '+52',
    country: 'Mexico',
    iso: 'MX',
    placeholder: '55 1234 5678',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits (e.g. 55 1234 5678)',
  },
  {
    code: '+64',
    country: 'New Zealand',
    iso: 'NZ',
    placeholder: '21 123 4567',
    minDigits: 8,
    maxDigits: 10,
    formatDescription: '8 to 10 digits without leading 0 (e.g. 21 123 4567)',
  },
  {
    code: '+48',
    country: 'Poland',
    iso: 'PL',
    placeholder: '512 345 678',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits (e.g. 512 345 678)',
  },
  {
    code: '+20',
    country: 'Egypt',
    iso: 'EG',
    placeholder: '10 1234 5678',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 1 (e.g. 10 1234 5678)',
  },
  {
    code: '+90',
    country: 'Turkey',
    iso: 'TR',
    placeholder: '532 123 4567',
    minDigits: 10,
    maxDigits: 10,
    formatDescription: '10 digits starting with 5 (e.g. 532 123 4567)',
  },
  {
    code: '+62',
    country: 'Indonesia',
    iso: 'ID',
    placeholder: '812 3456 789',
    minDigits: 9,
    maxDigits: 12,
    formatDescription: '9 to 12 digits (e.g. 812 3456 789)',
  },
  {
    code: '+886',
    country: 'Taiwan',
    iso: 'TW',
    placeholder: '912 345 678',
    minDigits: 9,
    maxDigits: 9,
    formatDescription: '9 digits starting with 9 (e.g. 912 345 678)',
  },
  {
    code: '+60',
    country: 'Malaysia',
    iso: 'MY',
    placeholder: '12 345 6789',
    minDigits: 9,
    maxDigits: 10,
    formatDescription: '9 to 10 digits without leading 0 (e.g. 12 345 6789)',
  },
  {
    code: '+00',
    country: 'Other / International',
    iso: 'INTL',
    placeholder: 'Phone number',
    minDigits: 7,
    maxDigits: 15,
    formatDescription: '7 to 15 digits according to ITU-T standards',
  },
];

export function getCountryCodeInfo(code: string): CountryCodeInfo {
  return (
    COUNTRY_CODES.find((c) => c.code === code) ||
    COUNTRY_CODES.find((c) => c.code === '+91') ||
    COUNTRY_CODES[0]
  );
}

/**
 * Validates a candidate's full name.
 *
 * Rules:
 * - Reject empty or whitespace-only names.
 * - Reject numbers anywhere in the name.
 * - Trim leading and trailing whitespace.
 * - Allow normal names containing spaces, hyphens, apostrophes, and international characters.
 * - Do not require English-only letters (Unicode \p{L} and \p{M} supported).
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Full name is required.' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Full name cannot be blank or whitespace-only.' };
  }

  // Reject numbers included in names
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'Name cannot contain numbers.' };
  }

  // Reject non-name symbols like @, #, $, %, !, _, +, =, <, >, etc.
  // Allowed: letters from any language (\p{L}), combining marks (\p{M}), spaces, hyphens (-), and apostrophes (')
  const namePattern = /^[\p{L}\p{M}'\- ]+$/u;
  if (!namePattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes.',
    };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates email according to standard format.
 *
 * Rules:
 * - Reject empty or whitespace-only values.
 * - Reject malformed email addresses.
 * - Accept valid addresses regardless of capitalization (case-insensitive).
 * - Trim surrounding whitespace.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email address cannot be blank.' };
  }

  // No internal whitespace
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Email address cannot contain spaces.' };
  }

  // Case-insensitive standard email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validates phone number according to country code rules.
 *
 * Rules:
 * - If empty/unsupplied, valid (since phone is an optional field in personal info).
 * - If provided, extracts digits and enforces country-specific length & prefix rules.
 * - For India (+91): exactly 10 digits starting with 6, 7, 8, or 9.
 * - Reject letters or invalid characters.
 */
export function validatePhone(
  phone: string,
  countryCode: string
): ValidationResult & { formattedPhone: string; expectedFormat: string } {
  const countryInfo = getCountryCodeInfo(countryCode);
  const expectedFormat = countryInfo.formatDescription;

  if (!phone || !phone.trim()) {
    return {
      isValid: true,
      error: null,
      formattedPhone: '',
      expectedFormat,
    };
  }

  const trimmed = phone.trim();

  // Check if candidate typed invalid letters or illegal characters (only digits, spaces, -, (, ), . allowed)
  if (/[^\d\s\-\(\)\.]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Phone number can only contain digits, spaces, hyphens, and parentheses.',
      formattedPhone: trimmed,
      expectedFormat,
    };
  }

  // Extract raw digits
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 0) {
    return {
      isValid: false,
      error: 'Please enter valid phone digits.',
      formattedPhone: trimmed,
      expectedFormat,
    };
  }

  // Run country-specific custom validator if available
  if (countryInfo.customValidator) {
    const customResult = countryInfo.customValidator(digits);
    if (!customResult.isValid) {
      return {
        isValid: false,
        error: customResult.error,
        formattedPhone: `${countryInfo.code} ${trimmed}`,
        expectedFormat,
      };
    }
  } else {
    // Standard digit length boundary check
    if (digits.length < countryInfo.minDigits || digits.length > countryInfo.maxDigits) {
      const lengthMsg =
        countryInfo.minDigits === countryInfo.maxDigits
          ? `exactly ${countryInfo.minDigits} digits`
          : `between ${countryInfo.minDigits} and ${countryInfo.maxDigits} digits`;
      return {
        isValid: false,
        error: `${countryInfo.country} phone numbers require ${lengthMsg} (currently ${digits.length}).`,
        formattedPhone: `${countryInfo.code} ${trimmed}`,
        expectedFormat,
      };
    }
  }

  // Format cleanly with country code
  const formattedPhone = `${countryInfo.code} ${trimmed}`;

  return {
    isValid: true,
    error: null,
    formattedPhone,
    expectedFormat,
  };
}

/**
 * Validates an education record according to RADIX Talent Match rules:
 * - Degree or qualification is required (non-empty after trim)
 * - Institution or university is required (non-empty after trim)
 * - Field of study and graduation year are optional
 */
export function validateEducationRecord(record: {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  graduationYear?: string;
}) {
  const degreeTrimmed = (record.degree || '').trim();
  const institutionTrimmed = (record.institution || '').trim();

  const isDegreeValid = degreeTrimmed.length > 0;
  const isInstitutionValid = institutionTrimmed.length > 0;

  return {
    isDegreeValid,
    isInstitutionValid,
    isComplete: isDegreeValid && isInstitutionValid,
    degreeError: isDegreeValid ? null : 'Degree or qualification is required.',
    institutionError: isInstitutionValid ? null : 'Institution or university is required.',
  };
}

