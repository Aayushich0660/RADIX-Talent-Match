import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Code2,
  Trophy,
  Briefcase,
  Award,
  Compass,
  FileText,
  Eye,
} from 'lucide-react';
import { CandidateProfileState } from '../types/profile';
import { ProfileCompletionResult } from '../utils/completion';

interface ProfileSummaryProps {
  state: CandidateProfileState;
  completion: ProfileCompletionResult;
  onOpenPreview: () => void;
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  state,
  completion,
  onOpenPreview,
}) => {
  const { score, completedCount, totalRequiredCount, isReadyForSubmission, enrichmentStats } =
    completion;

  const displayName = state.personal.fullName.trim() || 'Anonymous Candidate';
  const displayEmail = state.personal.email.trim();
  const displayPhone = state.personal.phone?.trim()
    ? `${state.personal.countryCode || '+91'} ${state.personal.phone.trim()}`
    : '';
  const displayLocation = state.personal.cityCountry.trim();

  // Primary education highlight
  const primaryEdu = state.education.find((e) => e.degree.trim() || e.institution.trim());
  const eduSummary = primaryEdu
    ? `${primaryEdu.degree || 'Degree'}${primaryEdu.fieldOfStudy ? ` in ${primaryEdu.fieldOfStudy}` : ''}${
        primaryEdu.institution ? ` · ${primaryEdu.institution}` : ''
      }${primaryEdu.graduationYear ? ` (${primaryEdu.graduationYear})` : ''}`
    : 'No education added yet';

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Primary Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E8E6F0]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#73778C]">
            Live Profile Summary
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
              isReadyForSubmission
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]'
            }`}
          >
            {isReadyForSubmission ? 'Ready' : 'In Progress'}
          </span>
        </div>

        {/* Identity Block */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#6558D9] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
            {displayName[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-[#20243A] truncate" title={displayName}>
              {displayName}
            </h3>
            {displayEmail ? (
              <p className="text-xs text-[#73778C] truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#9E9EAF] shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>
            ) : (
              <p className="text-xs text-[#9E9EAF] italic mt-0.5">No email provided</p>
            )}
            {displayPhone && (
              <p className="text-xs text-[#73778C] truncate flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#9E9EAF] shrink-0" />
                <span className="truncate">{displayPhone}</span>
              </p>
            )}
            {displayLocation && (
              <p className="text-xs text-[#73778C] truncate flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#9E9EAF] shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Readiness Score Ring / Progress */}
        <div className="p-4 rounded-xl bg-[#F5F4FA] border border-[#E8E6F0] mb-5">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-[#20243A]">Completion Score</span>
            <span className="text-base font-bold tabular-nums text-[#6558D9]">{score}%</span>
          </div>
          <div className="w-full bg-[#E8E6F0] h-2 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full transition-all duration-300 ${
                isReadyForSubmission
                  ? 'bg-emerald-600'
                  : 'bg-[#6558D9]'
              }`}
              style={{ width: `${Math.max(score, 3)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#73778C]">
            {isReadyForSubmission ? (
              <span className="text-emerald-700 font-medium">
                Candidate profile meets all required submission standards.
              </span>
            ) : (
              <span>
                {completedCount} of {totalRequiredCount} core requirements satisfied.
              </span>
            )}
          </p>
        </div>

        {/* 4-Stat Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]">
            <div className="flex items-center gap-1.5 text-[#73778C] text-[11px] font-medium mb-1">
              <Code2 className="w-3.5 h-3.5 text-[#6558D9]" />
              <span>Skills</span>
            </div>
            <span className="text-lg font-bold text-[#20243A] tabular-nums">
              {enrichmentStats.skillsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]">
            <div className="flex items-center gap-1.5 text-[#73778C] text-[11px] font-medium mb-1">
              <Trophy className="w-3.5 h-3.5 text-[#B87A1E]" />
              <span>Projects</span>
            </div>
            <span className="text-lg font-bold text-[#20243A] tabular-nums">
              {enrichmentStats.hackathonsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]">
            <div className="flex items-center gap-1.5 text-[#73778C] text-[11px] font-medium mb-1">
              <Briefcase className="w-3.5 h-3.5 text-[#1E7450]" />
              <span>Experience</span>
            </div>
            <span className="text-lg font-bold text-[#20243A] tabular-nums">
              {enrichmentStats.internshipsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]">
            <div className="flex items-center gap-1.5 text-[#73778C] text-[11px] font-medium mb-1">
              <Award className="w-3.5 h-3.5 text-[#5A3896]" />
              <span>Certs</span>
            </div>
            <span className="text-lg font-bold text-[#20243A] tabular-nums">
              {enrichmentStats.certificationsCount}
            </span>
          </div>
        </div>

        {/* Academic Snippet */}
        <div className="mb-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#20243A] mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-[#6558D9]" />
            <span>Academic Background</span>
          </div>
          <p
            className={`truncate ${
              primaryEdu ? 'text-[#20243A] font-medium' : 'text-[#9E9EAF] italic'
            }`}
            title={eduSummary}
          >
            {eduSummary}
          </p>
        </div>

        {/* Preferred Roles Snippet */}
        <div className="mb-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#20243A] mb-1.5">
            <Compass className="w-3.5 h-3.5 text-[#6558D9]" />
            <span>Target Roles ({state.preferredRoles.length})</span>
          </div>
          {state.preferredRoles.length === 0 ? (
            <p className="text-[#9E9EAF] italic">No preferred roles selected</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {state.preferredRoles.slice(0, 4).map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]"
                >
                  {role}
                </span>
              ))}
              {state.preferredRoles.length > 4 && (
                <span className="px-1.5 py-0.5 rounded-md text-[11px] text-[#73778C] bg-[#F5F4FA]">
                  +{state.preferredRoles.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* CV Attachment Status */}
        <div className="mb-5 text-xs p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-[#6558D9] shrink-0" />
            <span className="truncate text-[#20243A] font-medium">
              {state.cvFile ? state.cvFile.fileName : 'No CV Attached'}
            </span>
          </div>
          {state.cvFile ? (
            <span className="text-[11px] text-[#4F46BA] font-semibold bg-[#F0EEFA] border border-[#DCD8F0] px-2 py-0.5 rounded-md shrink-0">
              {state.cvFile.fileSizeFormatted}
            </span>
          ) : (
            <span className="text-[11px] text-[#925B0B] font-semibold bg-[#FDF6E8] border border-[#F4E3BF] px-2 py-0.5 rounded-md shrink-0">
              Missing
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#E8E6F0]">
          <button
            type="button"
            onClick={onOpenPreview}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-xl shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Complete Profile</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
