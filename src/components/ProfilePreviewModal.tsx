import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  GraduationCap,
  Code2,
  Trophy,
  Briefcase,
  Award,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { CandidateProfileState, RADIX_SKILL_CATEGORIES } from '../types/profile';
import { exportToRadixProfileJSON, serializeEducationToString } from '../utils/exportProfile';
import { calculateProfileCompletion } from '../utils/completion';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CandidateProfileState;
}

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Generate standardized RADIX JSON export directly from live state
  const exportedProfile = useMemo(() => exportToRadixProfileJSON(state), [state]);
  const completion = useMemo(() => calculateProfileCompletion(state), [state]);
  const jsonString = useMemo(() => JSON.stringify(exportedProfile, null, 2), [exportedProfile]);

  if (!isOpen) return null;

  const handleCopyJSON = async () => {
    setCopyError(null);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch {
      setCopyError('Direct clipboard access failed. You can select and copy the text directly below.');
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = (exportedProfile.name || 'candidate_profile')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    a.download = `${sanitizedName}_radix_profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const missingRequirements = completion.milestones.filter((m) => !m.isComplete);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#20243A]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E8E6F0]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6F0] bg-[#F5F4FA]/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="preview-modal-title" className="text-base sm:text-lg font-bold text-[#20243A]">
                Candidate Profile Review
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0]">
                {completion.score}% Complete
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Role 3 Schema Contract · Evaluator Summary & Export Package
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center p-1 bg-[#E8E6F0] rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'visual'
                    ? 'bg-white text-[#20243A] shadow-2xs'
                    : 'text-[#73778C] hover:text-[#20243A]'
                }`}
              >
                Profile Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'bg-white text-[#6558D9] shadow-2xs'
                    : 'text-[#73778C] hover:text-[#20243A]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Schema</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#73778C] hover:text-[#20243A] hover:bg-[#E8E6F0] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Status Notification Banner */}
        {missingRequirements.length > 0 ? (
          <div className="px-6 py-2.5 bg-[#FDF6E8] border-b border-[#F4E3BF] text-xs text-[#925B0B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B87A1E] shrink-0" />
              <span>
                <strong>Profile Incomplete ({completion.completedCount}/6 core criteria met):</strong>{' '}
                Missing {missingRequirements.map((m) => m.label).join(', ')}.
              </span>
            </div>
            <span className="text-[11px] text-[#925B0B] opacity-80 shrink-0 hidden sm:inline">
              Draft export available
            </span>
          </div>
        ) : (
          <div className="px-6 py-2 bg-[#ECF7F2] border-b border-[#CCEADB] text-xs text-[#1E7450] flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#1E7450] shrink-0" />
            <span>All 6 core profile requirements are satisfied and ready for evaluation.</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#F5F4FA]/50">
          {activeTab === 'visual' ? (
            /* Visual Executive Profile */
            <div className="space-y-6 max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E6F0] shadow-xs">
              {/* Identity Header */}
              <div className="border-b border-[#E8E6F0] pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-[#20243A]">
                      {exportedProfile.name || 'Untitled Candidate'}
                    </h3>
                    <p className="text-sm text-[#73778C] mt-0.5">
                      {exportedProfile.email || 'No email specified'}
                    </p>
                    {exportedProfile.phone && (
                      <p className="text-xs text-[#73778C] mt-0.5">{exportedProfile.phone}</p>
                    )}
                    {state.personal.cityCountry && (
                      <p className="text-xs text-[#73778C] mt-0.5">{state.personal.cityCountry}</p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]">
                      RADIX Talent Match Candidate
                    </span>
                    <p className="text-[11px] text-[#9E9EAF] mt-1">In-Memory State Package</p>
                  </div>
                </div>

                {/* Target roles badges */}
                {exportedProfile.preferred_roles.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#73778C] mr-1">Target Roles:</span>
                    {exportedProfile.preferred_roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#73778C] mb-3 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#6558D9]" />
                  Technical Competencies ({exportedProfile.skills.length})
                </h4>
                {exportedProfile.skills.length === 0 ? (
                  <p className="text-xs text-[#9E9EAF] italic">No skills listed</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {exportedProfile.skills.map((s, idx) => {
                      const catDef =
                        RADIX_SKILL_CATEGORIES[s.category_code] || RADIX_SKILL_CATEGORIES.OTHER;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#20243A]">{s.skill_name}</span>
                            <span
                              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${catDef.badgeClass}`}
                            >
                              {s.category_code}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[#73778C] text-[11px]">
                            <span>Category: {catDef.label}</span>
                            <span className="capitalize font-medium text-[#20243A]">
                              {s.confidence ? `${s.confidence} confidence` : 'Confidence unset'}
                            </span>
                          </div>
                          {s.evidence && (
                            <p className="mt-1.5 text-[11px] text-[#73778C] italic bg-white p-1.5 rounded-lg border border-[#E8E6F0]">
                              "{s.evidence}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Education section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#73778C] mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#6558D9]" />
                  Academic History ({exportedProfile.education.length})
                </h4>
                {exportedProfile.education.length === 0 ? (
                  <p className="text-xs text-[#9E9EAF] italic">No qualifications listed</p>
                ) : (
                  <div className="space-y-2">
                    {exportedProfile.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-[#20243A] text-sm">
                              {edu.degree || 'Degree'}
                              {edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                            </span>
                            <p className="text-[#73778C] mt-0.5">
                              {edu.institution || 'Institution unspecified'}
                            </p>
                          </div>
                          {edu.graduation_year && (
                            <span className="text-xs font-medium text-[#73778C] tabular-nums">
                              {edu.graduation_year}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hackathons & Projects */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#73778C] mb-3 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#B87A1E]" />
                  Hackathons & Projects ({exportedProfile.hackathons.length})
                </h4>
                {exportedProfile.hackathons.length === 0 ? (
                  <p className="text-xs text-[#9E9EAF] italic">No projects recorded</p>
                ) : (
                  <div className="space-y-2.5">
                    {exportedProfile.hackathons.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-[#20243A]">
                              {h.title || h.name || 'Untitled Project'}
                            </span>
                            {h.name && h.name !== h.title && (
                              <p className="text-[#73778C] text-[11px] font-medium">{h.name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                                h.type === 'hackathon'
                                  ? 'bg-[#FDF6E8] text-[#8B5812] border border-[#F4E3BF]'
                                  : 'bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]'
                              }`}
                            >
                              {h.type}
                            </span>
                            {h.date_or_year && (
                              <span className="text-[#73778C] text-[11px]">{h.date_or_year}</span>
                            )}
                          </div>
                        </div>
                        {h.description && (
                          <p className="mt-1.5 text-[#73778C] leading-relaxed">{h.description}</p>
                        )}
                        {h.technologies && h.technologies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.technologies.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0] text-[11px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#73778C] mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#1E7450]" />
                  Internships & Work Experience ({exportedProfile.internships.length})
                </h4>
                {exportedProfile.internships.length === 0 ? (
                  <p className="text-xs text-[#9E9EAF] italic">No internships recorded</p>
                ) : (
                  <div className="space-y-2.5">
                    {exportedProfile.internships.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-[#20243A]">
                              {exp.role || 'Role'}
                            </span>
                            <p className="text-[#73778C] text-[11px]">
                              {exp.company || 'Company'}
                            </p>
                          </div>
                          <span className="text-[#73778C] text-[11px]">
                            {exp.start_date || 'Start'} – {exp.end_date || 'Present'}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="mt-1.5 text-[#73778C] leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              {exportedProfile.certifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#73778C] mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#5A3896]" />
                    Certifications ({exportedProfile.certifications.length})
                  </h4>
                  <div className="space-y-2">
                    {exportedProfile.certifications.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-[#20243A]">{c.name}</span>
                          <p className="text-[#73778C] text-[11px]">{c.issuing_organization}</p>
                        </div>
                        <span className="text-[#73778C] text-[11px]">{c.issue_year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached CV */}
              <div className="p-3.5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#6558D9]" />
                  <span className="font-medium text-[#20243A]">
                    CV Attachment: {exportedProfile.cv_file || 'None'}
                  </span>
                </div>
                <span className="text-[#73778C] text-[11px]">Local Client Artifact</span>
              </div>
            </div>
          ) : (
            /* Structured JSON View */
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[#73778C]">
                  RADIX Profile JSON Contract (Role 3)
                </span>
                <span className="text-[#9E9EAF] font-mono text-[11px]">
                  {jsonString.split('\n').length} lines · {new TextEncoder().encode(jsonString).length} bytes
                </span>
              </div>

              {/* Schema Decision Documentation Callout */}
              <div className="p-3 rounded-xl bg-[#F0EEFA] border border-[#DCD8F0] text-xs text-[#4F46BA] space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#6558D9]" />
                  Schema Decision Note on Education:
                </p>
                <p className="text-[#20243A] leading-relaxed">
                  The initial brief noted education as a field. To support multiple qualifications without loss, the contract structures <code className="font-mono bg-white px-1 py-0.5 rounded text-[#4F46BA]">education</code> as an array of academic records. For systems requiring a single serialized string, downstream consumers can call <code className="font-mono bg-white px-1 py-0.5 rounded text-[#4F46BA]">serializeEducationToString()</code>:
                </p>
                <p className="text-[11px] text-[#73778C] italic bg-white/80 p-1.5 rounded font-mono">
                  "{serializeEducationToString(exportedProfile.education) || 'No education records'}"
                </p>
              </div>

              {copyError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{copyError}</span>
                </div>
              )}

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#161826] text-slate-100 p-4 font-mono text-xs max-h-[50vh] overflow-y-auto">
                <pre className="overflow-x-auto whitespace-pre font-mono leading-relaxed">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E8E6F0] bg-white gap-3">
          <p className="text-xs text-[#73778C] text-center sm:text-left">
            In-memory session only · No data is saved to a server or external database.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#20243A] bg-white border border-[#E8E6F0] rounded-lg hover:bg-[#F5F4FA] shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#73778C]" />
              <span>Download JSON</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-lg shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#73778C] hover:text-[#20243A] rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
