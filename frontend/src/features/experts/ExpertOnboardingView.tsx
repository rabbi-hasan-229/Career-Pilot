import React, { useState } from 'react';
import { Award, CheckCircle2, Compass, LogOut } from 'lucide-react';
import type { ExpertProfile, ExpertRegistrationDraft, Profile } from '../../types';
import { ExpertProfileFormFields } from './ExpertProfileFormFields';
import { createInitialExpertDraft } from './expertMatching';
import { expertRepository, loadPendingExpertDraft } from './expertRepository';

interface Props {
  profile: Profile;
  onComplete: (expertProfile: ExpertProfile) => void;
  onSignOut: () => void;
  onToast: (msg: string) => void;
}

export const ExpertOnboardingView: React.FC<Props> = ({
  profile,
  onComplete,
  onSignOut,
  onToast,
}) => {
  const [draft, setDraft] = useState<ExpertRegistrationDraft>(() => {
    const pending = loadPendingExpertDraft();
    if (pending) return pending;
    return createInitialExpertDraft({
      display_name: profile.full_name,
      location: profile.location || '',
      portfolio_url: profile.portfolio_url || '',
      linkedin_url: profile.linkedin_url || '',
      github_url: profile.github_url || '',
      bio: profile.bio || '',
    });
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (draft.headline.trim().length < 3) {
      setError('Enter your professional headline (at least 3 characters).');
      return;
    }
    if (draft.categories.length === 0) {
      setError('Select at least one career category you mentor in.');
      return;
    }
    if (!cvFile && draft.cv_summary.trim().length < 10) {
      setError('Upload your CV file or enter at least 10 characters in your CV summary.');
      return;
    }

    setIsSaving(true);
    try {
      let cvStoragePath: string | null = null;
      let cvFilename: string | null = null;
      if (cvFile) {
        const uploaded = await expertRepository.uploadExpertCV(profile.id, cvFile);
        cvStoragePath = uploaded.storagePath;
        cvFilename = uploaded.filename;
      }

      const saved = await expertRepository.saveExpertProfile({
        displayName: draft.display_name || profile.full_name,
        avatarUrl: profile.avatar_url,
        headline: draft.headline,
        bio: draft.bio,
        currentCompany: draft.current_company,
        location: draft.location,
        timezone: draft.timezone,
        yearsExperience: draft.years_experience,
        categories: draft.categories,
        targetRoles: draft.target_roles,
        skills: draft.skills,
        experiences: draft.experiences.filter((exp) => exp.title.trim() || exp.company.trim()),
        portfolioUrl: draft.portfolio_url,
        linkedinUrl: draft.linkedin_url,
        githubUrl: draft.github_url,
        cvStoragePath,
        cvFilename,
        cvSummary: draft.cv_summary,
        hourlyRateCents: draft.hourly_rate_cents,
        meetingModes: draft.meeting_modes,
        offlineCities: draft.offline_cities,
        offlineNotes: draft.offline_notes,
        defaultMeetingUrl: draft.default_meeting_url,
        maxHoursPerSession: draft.max_hours_per_session,
      });

      onToast('Expert profile activated. Welcome to your Expert Dashboard!');
      onComplete(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate your expert profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--md-bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'grid', gap: '16px' }}>
        <header
          className="m3-surface-card"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--md-primary)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
                Complete Your Expert Profile
              </h1>
              <p style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', margin: 0 }}>
                Add your CV, portfolio, experience, and hourly wage to start accepting 1-on-1 sessions.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-m3-white"
            onClick={onSignOut}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="m3-surface-card" style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: 'var(--md-primary)' }}>
            <Award size={16} />
            <span>Once submitted, your profile goes live immediately in the Learner Experts Marketplace</span>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--md-error-bg)',
                color: 'var(--md-error)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <ExpertProfileFormFields
            draft={draft}
            onChange={setDraft}
            onCvFileSelected={setCvFile}
            onError={setError}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button
              type="submit"
              className="btn-m3-primary"
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px' }}
            >
              <CheckCircle2 size={16} />
              <span>{isSaving ? 'Activating Expert Profile...' : 'Activate Expert Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
