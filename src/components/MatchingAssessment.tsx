import { useEffect, useState } from 'react';
import { LoaderCircle, Target } from 'lucide-react';
import { RadixExportProfile } from '../types/profile';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

interface JobDescriptionOption {
  source_file: string;
  company: string;
  role: string;
}

interface MissingSkill {
  skill_name: string;
  category_code: string;
}

interface AnalysisResult {
  talent_check: {
    company: string;
    readiness_score: number;
    skillset_gap: Array<{
      category_code: string;
      required_level: number;
      candidate_level: number;
      gap: boolean;
    }>;
  };
  skill_match: {
    jd_source_file: string;
    match_score: number;
    matched_skills: unknown[];
    missing_skills: MissingSkill[];
  };
}

interface MatchingAssessmentProps {
  profile: RadixExportProfile;
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed.');
  }
  return body as T;
}

export function MatchingAssessment({ profile }: MatchingAssessmentProps) {
  const [companies, setCompanies] = useState<string[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionOption[]>([]);
  const [company, setCompany] = useState('');
  const [jdSourceFile, setJdSourceFile] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API_BASE_URL}/matching/companies`).then(readResponse<string[]>),
      fetch(`${API_BASE_URL}/matching/jds`).then(readResponse<JobDescriptionOption[]>),
    ])
      .then(([companyOptions, jdOptions]) => {
        if (!active) return;
        setCompanies(companyOptions);
        setJobDescriptions(jdOptions);
        setCompany(companyOptions[0] || '');
        setJdSourceFile(jdOptions[0]?.source_file || '');
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load assessment options.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setResult(null);
  }, [profile]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/matching/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, company, jd_source_file: jdSourceFile }),
      });
      setResult(await readResponse<AnalysisResult>(response));
    } catch (requestError: unknown) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : 'Assessment failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedJob = jobDescriptions.find((jd) => jd.source_file === jdSourceFile);

  return (
    <section className="mb-6 rounded-xl border border-[#D7E5E2] bg-white p-5 shadow-xs sm:p-6" aria-labelledby="matching-title">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F4F1] text-[#247467]">
          <Target className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 id="matching-title" className="text-base font-semibold text-[#20243A]">Role assessment</h2>
          <p className="mt-1 text-xs text-[#73778C]">Compare this profile with company expectations and a job description.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="grid gap-1.5 text-xs font-medium text-[#464A5E]">
          Company readiness
          <select
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            disabled={isLoadingOptions || companies.length === 0}
            className="min-h-10 rounded-lg border border-[#DADCE4] bg-white px-3 text-sm text-[#20243A] focus:border-[#247467] focus:outline-none focus:ring-2 focus:ring-[#247467]/20"
          >
            {companies.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-[#464A5E]">
          Job description
          <select
            value={jdSourceFile}
            onChange={(event) => setJdSourceFile(event.target.value)}
            disabled={isLoadingOptions || jobDescriptions.length === 0}
            className="min-h-10 rounded-lg border border-[#DADCE4] bg-white px-3 text-sm text-[#20243A] focus:border-[#247467] focus:outline-none focus:ring-2 focus:ring-[#247467]/20"
          >
            {jobDescriptions.map((jd) => (
              <option key={jd.source_file} value={jd.source_file}>{jd.company} · {jd.role}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isLoadingOptions || isAnalyzing || !company || !jdSourceFile}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#247467] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1D6258] disabled:cursor-not-allowed disabled:opacity-55 focus:outline-none focus:ring-2 focus:ring-[#247467]/35 focus:ring-offset-2"
      >
        {isAnalyzing && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isAnalyzing ? 'Assessing profile…' : 'Run assessment'}
      </button>

      {isLoadingOptions && <p className="mt-3 text-xs text-[#73778C]">Connecting to assessment service…</p>}
      {error && <p className="mt-3 rounded-lg bg-[#FFF1F0] px-3 py-2 text-xs text-[#A52A24]" role="alert">{error}</p>}

      {result && (
        <div className="mt-5 border-t border-[#E8E6F0] pt-4" aria-live="polite">
          <p className="mb-3 text-xs font-medium text-[#73778C]">
            {result.talent_check.company} · {selectedJob?.role}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F0F7F5] p-3">
              <p className="text-[11px] font-medium text-[#54736D]">Readiness</p>
              <p className="mt-1 text-2xl font-semibold text-[#246B5F]">{result.talent_check.readiness_score}<span className="text-sm">%</span></p>
            </div>
            <div className="rounded-lg bg-[#F4F5F8] p-3">
              <p className="text-[11px] font-medium text-[#73778C]">Role match</p>
              <p className="mt-1 text-2xl font-semibold text-[#373C56]">{result.skill_match.match_score}<span className="text-sm">%</span></p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#464A5E]">Skills to develop ({result.skill_match.missing_skills.length})</p>
            {result.skill_match.missing_skills.length ? (
              <ul className="mt-2 space-y-2">
                {result.skill_match.missing_skills.map((skill) => (
                  <li key={`${skill.category_code}-${skill.skill_name}`} className="flex justify-between gap-3 text-xs text-[#55596D]">
                    <span>{skill.skill_name}</span><span className="shrink-0 text-[#8A8D9C]">{skill.category_code}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-xs text-[#247467]">No missing skills found for this description.</p>}
          </div>
        </div>
      )}
    </section>
  );
}