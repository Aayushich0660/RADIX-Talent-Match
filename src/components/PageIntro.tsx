import React from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { ProfileCompletionResult } from '../utils/completion';

interface PageIntroProps {
  completion: ProfileCompletionResult;
}

export const PageIntro: React.FC<PageIntroProps> = ({ completion }) => {
  const { score, completedCount, totalRequiredCount, milestones, isReadyForSubmission } = completion;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 mb-8 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Titles */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#6558D9] bg-[#F0EEFA] border border-[#E8E6F0] px-2.5 py-0.5 rounded-md uppercase">
              Role 3 · Talent Readiness Platform
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#20243A] text-balance">
            Build your candidate profile
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#73778C] leading-relaxed text-pretty">
            Bring your skills, education, and experience together in one place. Review your profile before using it to assess your readiness for a role.
          </p>
        </div>

        {/* Right: Dynamic Completion Metric Card */}
        <div className="shrink-0 bg-[#F5F4FA] border border-[#E8E6F0] rounded-xl p-4 sm:p-5 min-w-[280px]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-semibold text-[#73778C]">
              Profile Readiness
            </span>
            <span className="text-xl font-bold tabular-nums text-[#20243A]">
              {score}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E8E6F0] h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                isReadyForSubmission
                  ? 'bg-emerald-600'
                  : 'bg-[#6558D9]'
              }`}
              style={{ width: `${Math.max(score, 3)}%` }}
            />
          </div>

          {/* Checklist Summary */}
          <div className="flex items-center justify-between text-xs text-[#73778C]">
            <span className="flex items-center gap-1.5 font-medium">
              {isReadyForSubmission ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">All required fields complete</span>
                </>
              ) : (
                <>
                  <CircleDashed className="w-4 h-4 text-[#6558D9] animate-spin" />
                  <span>
                    <strong className="text-[#20243A] tabular-nums font-semibold">{completedCount}</strong> of{' '}
                    <strong className="text-[#20243A] tabular-nums font-semibold">{totalRequiredCount}</strong> required steps
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Required Milestones Strip */}
      <div className="mt-6 pt-5 border-t border-[#E8E6F0] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              m.isComplete
                ? 'bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0] font-medium'
                : 'bg-[#F5F4FA] text-[#73778C] border border-[#E8E6F0]'
            }`}
            title={m.hint}
          >
            {m.isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6558D9] shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-[#D0CDDF] shrink-0" />
            )}
            <span className="truncate">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
