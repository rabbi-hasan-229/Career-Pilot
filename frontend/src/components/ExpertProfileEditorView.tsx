import React, { useState } from 'react';
import { LogOut, Save, Trash2 } from 'lucide-react';
import type { ExpertProfile, ExpertRegistrationDraft } from '../types';
import { ExpertProfileFormFields } from '../features/experts/ExpertProfileFormFields';
import { expertRepository } from '../features/experts/expertRepository';
import { ExpertResourcesView } from './ExpertResourcesView';
import { ExpertIntroCard } from './ExpertIntroCard';

interface Props {
  expertProfile: ExpertProfile;
  onProfileUpdated: (updated: ExpertProfile) => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
  onToast: (msg: string) => void;
}

export const ExpertProfileEditorView: React.FC<Props> = ({
  expertProfile,
  onProfileUpdated,
  onSignOut,
  onDeleteAccount,
  onToast,
}) => {
  const [draft, setDraft] = useState<ExpertRegistrationDraft>({
    display_name: expertProfile.display_name,
    avatar_url: expertProfile.avatar_url || '',
    headline: expertProfile.headline,
    bio: expertProfile.bio,
    current_company: expertProfile.current_company || '',
    location: expertProfile.location || '',
    timezone: expertProfile.timezone,
    years_experience: expertProfile.years_experience,
    categories: expertProfile.categories,
    target_roles: expertProfile.target_roles,
    skills: expertProfile.skills,
    experiences:
      expertProfile.experiences.length > 0
        ? expertProfile.experiences
        : [{ title: '', company: '', period: '', summary: '' }],
    portfolio_url: expertProfile.portfolio_url || '',
    linkedin_url: expertProfile.linkedin_url || '',
    github_url: expertProfile.github_url || '',
    cv_summary: expertProfile.cv_summary || '',
    cv_filename: expertProfile.cv_filename || '',
    hourly_rate_cents: expertProfile.hourly_rate_cents,
    meeting_modes: expertProfile.meeting_modes,
    offline_cities: expertProfile.offline_cities,
    offline_notes: expertProfile.offline_notes || '',
    default_meeting_url: expertProfile.default_meeting_url || '',
    max_hours_per_session: expertProfile.max_hours_per_session,
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (draft.categories.length === 0) {
      setError('Select at least one career category.');
      return;
    }

    setIsSaving(true);
    try {
      let cvStoragePath = expertProfile.cv_storage_path || null;
      let cvFilename = expertProfile.cv_filename || null;
      if (cvFile) {
        const uploaded = await expertRepository.uploadExpertCV(expertProfile.user_id, cvFile);
        cvStoragePath = uploaded.storagePath;
        cvFilename = uploaded.filename;
      }

      const updated = await expertRepository.saveExpertProfile({
        displayName: draft.display_name,
        avatarUrl: draft.avatar_url || null,
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

      setCvFile(null);
      onProfileUpdated(updated);
      onToast('Expert profile, CV, and portfolio updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update expert profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <ExpertIntroCard expertProfile={expertProfile} />

      <form onSubmit={handleSave} className="m3-surface-card" style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Expert Portfolio, Experience & CV</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
              Keep your CV, work history, and mentoring specializations up to date for learners.
            </p>
          </div>
          <button
            type="submit"
            className="btn-m3-primary"
            disabled={isSaving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px' }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {error && (
          <div role="alert" style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--md-error-bg)', color: 'var(--md-error)', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <ExpertProfileFormFields
          draft={draft}
          onChange={setDraft}
          onCvFileSelected={setCvFile}
          existingCvFilename={expertProfile.cv_filename}
          onError={setError}
        />
      </form>

      <ExpertResourcesView expertId={expertProfile.user_id} onToast={onToast} />

      <section className="m3-surface-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Account Session & Danger Zone</h3>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
            Sign out of your expert portal or permanently delete your account.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-m3-white"
            onClick={onSignOut}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
          <button
            type="button"
            className="btn-m3-white"
            disabled={isDeleting}
            onClick={async () => {
              if (!window.confirm('Permanently delete your expert account and profile?')) return;
              setIsDeleting(true);
              try {
                await onDeleteAccount();
              } finally {
                setIsDeleting(false);
              }
            }}
            style={{ color: 'var(--md-error)', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </section>
    </div>
  );
};
