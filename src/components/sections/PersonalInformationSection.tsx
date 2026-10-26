import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, AlertCircle, Globe } from 'lucide-react';
import { PersonalInfo } from '../../types/profile';
import {
  validateName,
  validateEmail,
  validatePhone,
  COUNTRY_CODES,
  getCountryCodeInfo,
} from '../../utils/validation';

interface PersonalInformationSectionProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
}

export const PersonalInformationSection: React.FC<PersonalInformationSectionProps> = ({
  data,
  onChange,
}) => {
  const [touched, setTouched] = useState<{ [K in keyof PersonalInfo]?: boolean }>({});

  const handleBlur = (field: keyof PersonalInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    // Also mark as touched on change so inline errors update immediately in real-time
    setTouched((prev) => ({ ...prev, [field]: true }));
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleCountryCodeChange = (newCode: string) => {
    onChange({
      ...data,
      countryCode: newCode,
    });
    // If phone is already entered, keep touched active to re-validate under new country code
    if (data.phone && data.phone.trim()) {
      setTouched((prev) => ({ ...prev, phone: true }));
    }
  };

  // 1. Name validation
  const nameValidation = validateName(data.fullName);
  const nameError = touched.fullName ? nameValidation.error : null;

  // 2. Email validation (case-insensitive, trimmed)
  const emailValidation = validateEmail(data.email);
  const emailError = touched.email ? emailValidation.error : null;

  // 3. Country code & Phone number validation
  const currentCountryCode = data.countryCode || '+91';
  const countryInfo = getCountryCodeInfo(currentCountryCode);
  const phoneValidation = validatePhone(data.phone || '', currentCountryCode);
  // Phone is an optional field: only show error if user entered something and it is invalid
  const phoneError =
    touched.phone && data.phone && data.phone.trim().length > 0 ? phoneValidation.error : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E8E6F0]">
        <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Personal Information</h2>
          <p className="text-xs text-[#73778C]">Provide contact details so recruiters and readiness evaluators can reach you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-xs font-semibold text-[#20243A] mb-1.5">
            Full Name <span className="text-rose-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73778C]">
              <User className="w-4 h-4" />
            </div>
            <input
              id="fullName"
              type="text"
              required
              value={data.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="e.g. Jordan Rivera"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'fullName-error' : undefined}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none ${
                nameError
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                  : touched.fullName && nameValidation.isValid
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
              }`}
            />
          </div>
          {nameError && (
            <p id="fullName-error" className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#20243A] mb-1.5">
            Email Address <span className="text-rose-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73778C]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="e.g. jordan.rivera@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error' : undefined}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none ${
                emailError
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                  : touched.email && emailValidation.isValid
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
              }`}
            />
          </div>
          {emailError && (
            <p id="email-error" className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Phone Number with Country Code Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="phone" className="block text-xs font-semibold text-[#20243A]">
              Phone Number <span className="text-[#73778C] font-normal">(Optional)</span>
            </label>
            <span className="text-[11px] text-[#73778C] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#9E9EAF]" />
              {countryInfo.country}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="w-[125px] sm:w-[140px] shrink-0">
              <select
                id="countryCode"
                aria-label="Country Code"
                value={currentCountryCode}
                onChange={(e) => handleCountryCodeChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E8E6F0] bg-[#F5F4FA] text-[#20243A] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 focus:outline-none transition-all cursor-pointer font-medium"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={`${c.iso}-${c.code}`} value={c.code}>
                    {c.iso} ({c.code}) - {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile / Phone Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73778C]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="phone"
                type="tel"
                value={data.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder={countryInfo.placeholder}
                aria-invalid={Boolean(phoneError)}
                aria-describedby="phone-format-hint phone-error"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none ${
                  phoneError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                    : touched.phone && data.phone && phoneValidation.isValid
                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                    : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
                }`}
              />
            </div>
          </div>

          {/* Expected format hint */}
          <p id="phone-format-hint" className="mt-1 text-[11px] text-[#73778C]">
            Expected format: {countryInfo.formatDescription}
          </p>

          {/* Inline error */}
          {phoneError && (
            <p id="phone-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{phoneError}</span>
            </p>
          )}
        </div>

        {/* City and Country (Optional) */}
        <div>
          <label htmlFor="cityCountry" className="block text-xs font-semibold text-[#20243A] mb-1.5">
            City & Country <span className="text-[#73778C] font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#73778C]">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="cityCountry"
              type="text"
              value={data.cityCountry}
              onChange={(e) => handleChange('cityCountry', e.target.value)}
              placeholder="e.g. Austin, Texas, USA"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
