import React, { useState, useMemo } from 'react';
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
import { CandidateProfileState } from './types/profile';
import { calculateProfileCompletion } from './utils/completion';
import { INITIAL_EMPTY_PROFILE, SAMPLE_CANDIDATE_PROFILE } from './utils/sampleData';
import { CheckCircle2, Eye } from 'lucide-react';

export default function App() {
  const [profileState, setProfileState] = useState<CandidateProfileState>(INITIAL_EMPTY_PROFILE);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  );

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 3200);
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
    showNotification('Sample candidate profile loaded successfully for demonstration.');
  };

  const handleReset = () => {
    if (profileState.cvFile?.previewUrl) {
      URL.revokeObjectURL(profileState.cvFile.previewUrl);
    }
    setProfileState(INITIAL_EMPTY_PROFILE);
    showNotification('Profile form cleared.', 'info');
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
              onChange={(cvFile) => setProfileState((prev) => ({ ...prev, cvFile }))}
            />

            {/* Form Footer Action Bar */}
            <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#73778C] text-center sm:text-left">
                <span className="font-semibold text-[#20243A]">Form changes are saved live in memory.</span>
                <p className="mt-0.5">Preview your structured profile before role readiness assessment.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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

          {/* Secondary Column: Live Profile Summary */}
          <div className="lg:col-span-4">
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
            Frontend in-memory state engine · Compliant with RADIX Shared Profile Contract
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
