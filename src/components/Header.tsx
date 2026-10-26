import React, { useState } from 'react';
import { Sparkles, Eye, RotateCcw, Info, Database } from 'lucide-react';

interface HeaderProps {
  onOpenPreview: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPreview,
  onLoadSample,
  onReset,
  hasData,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#6558D9] text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
              R
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#20243A] tracking-tight text-base sm:text-lg">
                RADIX Talent Match
              </span>
              <span className="text-[#D8D5E5]">/</span>
              <span className="text-xs font-medium text-[#6558D9] bg-[#F0EEFA] border border-[#E8E6F0] px-2 py-0.5 rounded-md">
                Candidate Profile
              </span>
            </div>
          </div>

          {/* Center Status / Info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0EEFA] text-[#4F46BA] border border-[#E0DDF0] cursor-help transition-colors hover:bg-[#EBE7F8]"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                tabIndex={0}
                role="button"
                aria-label="In-memory status information"
              >
                <Database className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Draft · In memory</span>
                <Info className="w-3 h-3 text-[#73778C]" />
              </div>

              {/* Informational Tooltip */}
              {showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3.5 bg-[#20243A] text-slate-100 text-xs rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed border border-slate-700">
                  <p className="font-semibold text-white mb-1">In-Memory Local Session</p>
                  <p className="text-slate-300">
                    All candidate data resides purely in local React state. Data will reset if the page is refreshed. No remote server or database is connected.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#20243A] bg-[#F5F4FA] hover:bg-[#F0EEFA] active:bg-[#E8E6F0] border border-[#E8E6F0] rounded-lg transition-all"
              title="Populate demo candidate data for presentation"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6558D9]" />
              <span className="hidden sm:inline">Demo</span> Sample
            </button>

            {hasData && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset all form fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#6558D9]/40 focus:ring-offset-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Profile</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
