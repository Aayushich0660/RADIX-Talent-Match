import React, { useState, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { PageIntro } from './components/PageIntro';
import { PersonalInformationSection } from './components/sections/PersonalInformationSection';
import { EducationSection } from './components/sections/EducationSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { ProjectsAndHackathonsSection } from './components/sections/ProjectsAndHackathonsSection';
import { InternshipsSection } from './components/sections/InternshipsSection';
import { CertificationsSection } from './components/sections/CertificationsSection';
import { PreferredRolesSection } from './components/sections/PreferredRolesSection';
import { CvUploadSection } from './components/sections/CvUploadSection';
import { ProfileSummary } from './components/ProfileSummary';
import { ProfilePreviewModal } from './components/ProfilePreviewModal';
import { MatchingAssessment } from './components/MatchingAssessment';
import { CandidateProfileState } from './types/profile';
import { calculateProfileCompletion } from './utils/completion';
import { INITIAL_EMPTY_PROFILE, SAMPLE_CANDIDATE_PROFILE } from './utils/sampleData';
import { exportToRadixProfileJSON } from './utils/exportProfile';
import { deleteProfile, loadProfile, saveProfile } from './api/profileApi';
import { parseResumeFile } from './api/resumeParser';
import { profileToFormState } from './utils/profileAdapter';
import { mergeParsedResume } from './utils/resumeAdapter';
import { AlertCircle, CheckCircle2, Eye, LoaderCircle, Save, Trash2 } from 'lucide-react';

export default function App() {
  const [profileState, setProfileState] = useState<CandidateProfileState>(INITIAL_EMPTY_PROFILE);
  const profileStateRef = useRef(profileState);
  profileStateRef.current = profileState;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const exportedProfile = exportToRadixProfileJSON(profileState);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  );
  const [apiNotification, setApiNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [apiAction, setApiAction] = useState<'saving' | 'loading' | 'deleting' | null>(null);
  const isApiBusy = apiAction !== null;
  const [profileIdToLoad, setProfileIdToLoad] = useState('');
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  const requestInFlight = useRef(false);
  const parserInFlight = useRef(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parserAlert, setParserAlert] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const handleDeleteProfile = async () => {
    const profileId = savedProfileId;
    if (!profileId || requestInFlight.current) return;
    if (!window.confirm(`Delete saved profile ${profileId}? This cannot be undone.`)) return;

    requestInFlight.current = true;
    setApiAction('deleting');
    setApiNotification(null);

    try {
      await deleteProfile(profileId);
      setSavedProfileId(null);
      setProfileIdToLoad('');
      setApiNotification({
        message: `The backend confirmed deletion of profile ${profileId}. Your current form remains available.`,
        type: 'success',
      });
    } catch (error) {
      setApiNotification({
        message: error instanceof Error ? error.message : 'The profile could not be deleted.',
        type: 'error',
      });
    } finally {
      requestInFlight.current = false;
      setApiAction(null);
    }
  };

  // Compute profile readiness dynamically from current state
  const completion = useMemo(() => {
    return calculateProfileCompletion(profileState);
  }, [profileState]);

  // Check if form has any data entered
  const hasData = useMemo(() => {
    return (
      Boolean(profileState.personal.fullName.trim()) ||
      Boolean(profileState.personal.email.trim()) ||
      profileState.skills.length > 0 ||
      profileState.preferredRoles.length > 0 ||
      Boolean(profileState.cvFile)
    );
  }, [profileState]);

  const handleLoadSample = () => {
    setProfileState(SAMPLE_CANDIDATE_PROFILE);
    setSavedProfileId(null);
    setProfileIdToLoad('');
    setApiNotification(null);
    setParserAlert(null);
    showNotification('Sample candidate profile loaded successfully for demonstration.');
  };

  const handleReset = () => {
    if (profileState.cvFile?.previewUrl) {
      URL.revokeObjectURL(profileState.cvFile.previewUrl);
    }
    setProfileState(INITIAL_EMPTY_PROFILE);
    setSavedProfileId(null);
    setProfileIdToLoad('');
    setApiNotification(null);
    setParserAlert(null);
    showNotification('Profile form cleared.', 'info');
  };

  const handleCvChange = (cvFile: CandidateProfileState['cvFile']) => {
    setProfileState((prev) => ({ ...prev, cvFile }));
    setParserAlert(null);
  };

  const handleParseResume = async (file: File) => {
    if (parserInFlight.current) return;
    parserInFlight.current = true;
    setIsParsing(true);
    setParserAlert(null);

    try {
      const parsed = await parseResumeFile(file);
      const merged = mergeParsedResume(profileStateRef.current, parsed, file.name);
      profileStateRef.current = merged.profile;
      setProfileState(merged.profile);
      setParserAlert({
        type: 'success',
        message: 'Resume details were added to the editable profile form. Review them before saving.',
      });
    } catch (error) {
      setParserAlert({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Resume parsing failed. You can continue entering the profile manually.',
      });
    } finally {
      parserInFlight.current = false;
      setIsParsing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setApiAction('saving');
    setApiNotification(null);

    try {
      const record = await saveProfile(exportToRadixProfileJSON(profileState), savedProfileId);
      setSavedProfileId(record.id);
      setProfileIdToLoad(record.id);
      setApiNotification({
        message: `The backend confirmed the save. Profile ID: ${record.id}`,
        type: 'success',
      });
    } catch (error) {
      setApiNotification({
        message: error instanceof Error ? error.message : 'The profile could not be saved.',
        type: 'error',
      });
    } finally {
      requestInFlight.current = false;
      setApiAction(null);
    }
  };

  const handleLoadProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestInFlight.current) return;
    const profileId = profileIdToLoad.trim();
    if (!profileId) return;

    requestInFlight.current = true;
    setApiAction('loading');
    setApiNotification(null);

    try {
      const record = await loadProfile(profileId);
      setProfileState(profileToFormState(record.profile));
      setSavedProfileId(record.id);
      setParserAlert(null);
      setApiNotification({
        message: `Profile ${record.id} was loaded from the backend.`,
        type: 'success',
      });
    } catch (error) {
      setApiNotification({
        message: error instanceof Error ? error.message : 'The profile could not be loaded.',
        type: 'error',
      });
    } finally {
      requestInFlight.current = false;
      setApiAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4FA] text-[#20243A] flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg bg-[#20243A] text-white text-xs font-medium border border-[#373C56] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}
      {apiNotification && (
        <div
          role={apiNotification.type === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-5 left-5 z-50 flex max-w-xl items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-white text-xs font-medium border animate-in fade-in slide-in-from-bottom-2 ${
            apiNotification.type === 'error'
              ? 'bg-rose-700 border-rose-600'
              : 'bg-emerald-800 border-emerald-700'
          }`}
        >
          {apiNotification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{apiNotification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenPreview={() => setIsPreviewOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        hasData={hasData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
        {/* Page Introduction & Completion Bar */}
        <PageIntro completion={completion} />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Profile Builder Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Personal Info */}
            <PersonalInformationSection
              data={profileState.personal}
              onChange={(personal) => setProfileState((prev) => ({ ...prev, personal }))}
            />

            {/* Section 2: Education */}
            <EducationSection
              records={profileState.education}
              onChange={(education) => setProfileState((prev) => ({ ...prev, education }))}
            />

            {/* Section 3: Technical Skills (RADIX Taxonomy) */}
            <SkillsSection
              skills={profileState.skills}
              onChange={(skills) => setProfileState((prev) => ({ ...prev, skills }))}
            />

            {/* Section 4: Projects & Hackathons */}
            <ProjectsAndHackathonsSection
              records={profileState.hackathons}
              onChange={(hackathons) => setProfileState((prev) => ({ ...prev, hackathons }))}
            />

            {/* Section 5: Internships & Experience */}
            <InternshipsSection
              records={profileState.internships}
              onChange={(internships) => setProfileState((prev) => ({ ...prev, internships }))}
            />

            {/* Section 6: Certifications */}
            <CertificationsSection
              records={profileState.certifications}
              onChange={(certifications) => setProfileState((prev) => ({ ...prev, certifications }))}
            />

            {/* Section 7: Preferred Roles */}
            <PreferredRolesSection
              roles={profileState.preferredRoles}
              onChange={(preferredRoles) => setProfileState((prev) => ({ ...prev, preferredRoles }))}
            />

            {/* Section 8: CV Upload */}
            <CvUploadSection
              cvFile={profileState.cvFile}
              onChange={handleCvChange}
              onParse={handleParseResume}
              isParsing={isParsing}
            />
            {parserAlert && (
              <div
                role={parserAlert.type === 'error' ? 'alert' : 'status'}
                className={`rounded-xl border p-4 text-xs ${
                  parserAlert.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {parserAlert.message}
              </div>
            )}
            {/* Form Footer Action Bar */}
            <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 shadow-xs space-y-5">
              <div className="text-xs text-[#73778C]">
                <span className="font-semibold text-[#20243A]">Form changes stay in this browser until you save them.</span>
                <p className="mt-0.5">Saving sends the shared profile JSON to the backend. Preview and export remain available at any time.</p>
                {savedProfileId && (
                  <p className="mt-2 break-all">
                    <span className="font-semibold text-[#20243A]">Backend profile ID: </span>
                    <code>{savedProfileId}</code>
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <form onSubmit={handleLoadProfile} className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-xl">
                  <label htmlFor="load-profile-id" className="sr-only">Profile ID to load</label>
                  <input
                    id="load-profile-id"
                    type="text"
                    value={profileIdToLoad}
                    onChange={(event) => setProfileIdToLoad(event.target.value)}
                    placeholder="Enter a backend profile ID to load"
                    disabled={isApiBusy}
                    className="min-w-0 flex-1 px-3 py-2.5 text-xs rounded-xl border border-[#E8E6F0] text-[#20243A] placeholder-[#9E9EAF] focus:outline-none focus:border-[#6558D9] focus:ring-2 focus:ring-[#6558D9]/10 disabled:bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={isApiBusy || !profileIdToLoad.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#5145B8] border border-[#DCD8F0] hover:bg-[#F7F6FC] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {apiAction === 'loading' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
                    {apiAction === 'loading' ? 'Loading...' : 'Load profile'}
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {savedProfileId && (
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      disabled={isApiBusy}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {apiAction === 'deleting' ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {apiAction === 'deleting' ? 'Deleting...' : 'Delete saved profile'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isApiBusy}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {apiAction === 'saving' ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {apiAction === 'saving'
                      ? 'Saving...'
                      : savedProfileId
                        ? 'Update saved profile'
                        : 'Save to backend'}
                  </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#6558D9]/40 focus:ring-offset-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview & Export JSON</span>
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Column: Live Profile Summary */}
          <div className="lg:col-span-4">
            <MatchingAssessment profile={exportedProfile} />
            <ProfileSummary
              state={profileState}
              completion={completion}
              onOpenPreview={() => setIsPreviewOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E6F0] bg-white py-6 mt-14 text-center text-xs text-[#73778C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 RADIX Talent Match Hackathon · Role 3: Candidate Profile Builder</p>
          <p className="text-[#9E9EAF]">
            RADIX Shared Profile Contract · Backend storage depends on server configuration
          </p>
        </div>
      </footer>

      {/* Profile Review & JSON Export Modal */}
      <ProfilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        state={profileState}
      />
    </div>
  );
}
