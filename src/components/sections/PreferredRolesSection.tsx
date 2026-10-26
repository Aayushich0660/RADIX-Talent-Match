import React, { useState } from 'react';
import { Compass, Plus, X, Check, AlertCircle } from 'lucide-react';

interface PreferredRolesSectionProps {
  roles: string[];
  onChange: (updated: string[]) => void;
}

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Full-Stack Developer',
  'Cloud Engineer',
  'Application Support Analyst',
];

export const PreferredRolesSection: React.FC<PreferredRolesSectionProps> = ({
  roles,
  onChange,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [customRoleError, setCustomRoleError] = useState<string | null>(null);

  const toggleSuggestedRole = (role: string) => {
    const exists = roles.some((r) => r.trim().toLowerCase() === role.trim().toLowerCase());
    if (exists) {
      onChange(roles.filter((r) => r.trim().toLowerCase() !== role.trim().toLowerCase()));
    } else {
      onChange([...roles, role.trim()]);
    }
  };

  const handleAddCustomRole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customRoleText.trim();
    if (!trimmed) {
      setCustomRoleError('Please enter a role title before adding.');
      return;
    }

    if (trimmed.length < 2) {
      setCustomRoleError('Role title must be at least 2 characters.');
      return;
    }

    // Check duplicate ignoring case
    const isDuplicate = roles.some((r) => r.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setCustomRoleError(`"${trimmed}" is already included in your target roles.`);
      return;
    }

    onChange([...roles, trimmed]);
    setCustomRoleText('');
    setCustomRoleError(null);
  };

  const handleRemoveRole = (roleToRemove: string) => {
    onChange(roles.filter((r) => r.trim().toLowerCase() !== roleToRemove.trim().toLowerCase()));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            7
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Preferred Roles</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0] tabular-nums">
                {roles.length} selected
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Select standard target career roles or specify custom tracks.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Roles Removable Tags */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#20243A] mb-2">
          Currently Selected Roles <span className="text-rose-500">*</span>
        </label>
        {roles.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-[#F4E3BF] bg-[#FDF6E8]/70 text-xs text-[#925B0B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B87A1E] shrink-0" />
            <span>
              No preferred roles selected yet. Please select at least one role below to complete this requirement.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0] shadow-2xs"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  className="p-0.5 hover:bg-[#E0DDF0] rounded text-[#6558D9] transition-colors"
                  aria-label={`Remove role ${role}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Quick Select Grid */}
      <div className="space-y-3">
        <span className="block text-xs font-semibold text-[#73778C]">
          Suggested Career Roles
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SUGGESTED_ROLES.map((role) => {
            const isSelected = roles.some((r) => r.trim().toLowerCase() === role.trim().toLowerCase());
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleSuggestedRole(role)}
                className={`flex items-center justify-between px-3.5 py-2 text-xs rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#6558D9] bg-[#F0EEFA] text-[#20243A] font-semibold shadow-2xs'
                    : 'border-[#E8E6F0] bg-white text-[#20243A] hover:border-[#DCD8F0] hover:bg-[#F5F4FA]'
                }`}
              >
                <span>{role}</span>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#6558D9] text-white'
                      : 'border border-[#DCD8F0] bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          {/* "Other" Option Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(!showCustomInput);
              setCustomRoleError(null);
            }}
            className={`flex items-center justify-between px-3.5 py-2 text-xs rounded-xl border text-left transition-all ${
              showCustomInput
                ? 'border-[#6558D9] bg-[#F0EEFA] text-[#20243A] font-semibold'
                : 'border-[#E8E6F0] bg-white text-[#20243A] hover:border-[#DCD8F0] hover:bg-[#F5F4FA]'
            }`}
          >
            <span className="font-medium">+ Other Role</span>
            <span className="text-[#73778C] text-[11px]">
              {showCustomInput ? 'Hide' : 'Add custom'}
            </span>
          </button>
        </div>

        {/* Custom Role Input Box */}
        {showCustomInput && (
          <div className="space-y-1.5 mt-2">
            <form
              onSubmit={handleAddCustomRole}
              className="p-3 rounded-xl border border-[#DCD8F0] bg-[#F0EEFA]/40 flex items-center gap-2"
            >
              <input
                type="text"
                value={customRoleText}
                onChange={(e) => {
                  setCustomRoleText(e.target.value);
                  if (customRoleError) setCustomRoleError(null);
                }}
                placeholder="e.g. Site Reliability Engineer (SRE), Blockchain Developer"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E8E6F0] bg-white text-[#20243A] focus:outline-none focus:ring-3 focus:ring-[#6558D9]/10 focus:border-[#6558D9]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg transition-colors shrink-0"
              >
                Add Custom Role
              </button>
            </form>
            {customRoleError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-medium pl-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {customRoleError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
