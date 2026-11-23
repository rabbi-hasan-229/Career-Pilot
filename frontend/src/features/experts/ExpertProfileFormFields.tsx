import React from 'react';
import {
  Briefcase,
  DollarSign,
  FileText,
  Globe,
  Link2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { careerCategories, type CareerCategory } from '../roadmap/careerCatalog';
import type { ExpertExperienceItem, ExpertMeetingModes, ExpertRegistrationDraft } from '../../types';
import { validateExpertCVFile } from './expertRepository';
import { processAvatarFileToDataUrl } from '../account/avatarUpload';

interface Props {
  draft: ExpertRegistrationDraft;
  onChange: (next: ExpertRegistrationDraft) => void;
  onCvFileSelected?: (file: File | null) => void;
  existingCvFilename?: string | null;
  compact?: boolean;
  section?: 'all' | 'expertise' | 'credentials';
  onError?: (msg: string) => void;
}

const SELECTABLE_CATEGORIES = careerCategories.filter((c) => c.id !== 'all') as Array<{
  id: CareerCategory;
  label: string;
}>;

const fieldWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: 'var(--md-text-secondary, #334155)',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: '10px',
  border: '1px solid var(--md-outline, #CBD5E1)',
  background: 'var(--md-surface, #FFFFFF)',
  color: 'var(--md-text-primary, #0F172A)',
  fontSize: '13.5px',
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: 1.4,
};

const sectionCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '14px',
  border: '1px solid var(--md-outline, #E2E8F0)',
  background: 'var(--md-surface-variant, #F8FAFC)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

export const ExpertProfileFormFields: React.FC<Props> = ({
  draft,
  onChange,
  onCvFileSelected,
  existingCvFilename,
  compact = false,
  section = 'all',
  onError,
}) => {
  const [rolesInput, setRolesInput] = React.useState(draft.target_roles.join(', '));
  const [skillsInput, setSkillsInput] = React.useState(draft.skills.join(', '));
  const [citiesInput, setCitiesInput] = React.useState(draft.offline_cities.join(', '));
  const [isProcessingAvatar, setIsProcessingAvatar] = React.useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await processAvatarFileToDataUrl(file);
      onChange({ ...draft, avatar_url: dataUrl });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not process profile picture.');
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const parseCsv = (raw: string): string[] =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const toggleCategory = (cat: CareerCategory) => {
    const exists = draft.categories.includes(cat);
    const next = exists
      ? draft.categories.filter((c) => c !== cat)
      : [...draft.categories, cat];
    onChange({ ...draft, categories: next });
  };

  const updateExperience = (idx: number, patch: Partial<ExpertExperienceItem>) => {
    const updated = draft.experiences.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onChange({ ...draft, experiences: updated });
  };

  const addExperience = () => {
    onChange({
      ...draft,
      experiences: [...draft.experiences, { title: '', company: '', period: '', summary: '' }],
    });
  };

  const removeExperience = (idx: number) => {
    if (draft.experiences.length <= 1) return;
    onChange({
      ...draft,
      experiences: draft.experiences.filter((_, i) => i !== idx),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const err = validateExpertCVFile(file);
    if (err) {
      onError?.(err);
      return;
    }
    onCvFileSelected?.(file);
    onChange({ ...draft, cv_filename: file.name });
  };

  const showExpertise = section === 'all' || section === 'expertise';
  const showCredentials = section === 'all' || section === 'credentials';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '16px' : '20px' }}>
      {showExpertise && (
        <>
          <div style={sectionCardStyle}>
            {/* Profile Photo Upload */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--md-outline, #E2E8F0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={
                    draft.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(draft.display_name || 'Expert')}`
                  }
                  alt={draft.display_name || 'Expert profile'}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '1px solid var(--md-outline, #CBD5E1)',
                    background: 'var(--md-surface, #FFFFFF)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary, #0F172A)' }}>
                    Profile Picture
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary, #64748B)' }}>
                    Upload a headshot for your public mentor card (JPG, PNG, WebP)
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {draft.avatar_url && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...draft, avatar_url: '' })}
                    style={{
                      background: 'none',
                      border: '1px solid var(--md-outline, #CBD5E1)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--md-text-secondary, #64748B)',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '9px',
                    background: 'var(--md-surface, #FFFFFF)',
                    border: '1px solid var(--md-outline, #CBD5E1)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--md-primary, #123C69)',
                    cursor: isProcessingAvatar ? 'wait' : 'pointer',
                  }}
                >
                  <Upload size={13} />
                  <span>{isProcessingAvatar ? 'Uploading...' : draft.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleAvatarChange(e)}
                    disabled={isProcessingAvatar}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Headline & Company */}
            <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1.3fr 1fr', gap: '12px' }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Professional Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer · Distributed Systems"
                  value={draft.headline}
                  onChange={(e) => onChange({ ...draft, headline: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Current Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Stripe / Independent Consultant"
                  value={draft.current_company}
                  onChange={(e) => onChange({ ...draft, current_company: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Location, Years Experience, Hourly Rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '12px' }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>
                  <MapPin size={13} />
                  <span>City / Location</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka, BD"
                  value={draft.location}
                  onChange={(e) => onChange({ ...draft, location: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Years of Experience *</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={draft.years_experience}
                  onChange={(e) =>
                    onChange({ ...draft, years_experience: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })
                  }
                  required
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>
                  <DollarSign size={13} />
                  <span>Hourly Wage (USD/hr) *</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={2000}
                  step={1}
                  value={Math.round(draft.hourly_rate_cents / 100)}
                  onChange={(e) => {
                    const dollars = Math.max(5, Math.min(2000, Number(e.target.value) || 5));
                    onChange({ ...draft, hourly_rate_cents: Math.round(dollars * 100) });
                  }}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Bio */}
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>Mentoring Bio &amp; Session Approach *</label>
              <textarea
                rows={compact ? 3 : 3}
                placeholder="Describe how you mentor learners (code reviews, mock interviews, architecture guidance)..."
                value={draft.bio}
                onChange={(e) => onChange({ ...draft, bio: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Career Categories, Roles & Skills */}
          <div style={sectionCardStyle}>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>Career Categories You Mentor In * (select 1 or more)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {SELECTABLE_CATEGORIES.map((cat) => {
                  const selected = draft.categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${selected ? 'var(--md-primary, #123C69)' : 'var(--md-outline, #CBD5E1)'}`,
                        background: selected ? 'var(--md-primary, #123C69)' : 'var(--md-surface, #FFFFFF)',
                        color: selected ? '#FFFFFF' : 'var(--md-text-secondary, #475569)',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Target Roles Mentored (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Engineer, Backend Engineer"
                  value={rolesInput}
                  onChange={(e) => {
                    setRolesInput(e.target.value);
                    onChange({ ...draft, target_roles: parseCsv(e.target.value) });
                  }}
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Core Skills (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. TypeScript, PostgreSQL, System Design"
                  value={skillsInput}
                  onChange={(e) => {
                    setSkillsInput(e.target.value);
                    onChange({ ...draft, skills: parseCsv(e.target.value) });
                  }}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Meeting Modes */}
          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={labelStyle}>
                <Video size={14} />
                <span>Meeting Format Options *</span>
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(
                  [
                    { id: 'online', label: 'Online Only' },
                    { id: 'offline', label: 'Offline Only' },
                    { id: 'both', label: 'Online & Offline' },
                  ] as Array<{ id: ExpertMeetingModes; label: string }>
                ).map((opt) => {
                  const active = draft.meeting_modes === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...draft, meeting_modes: opt.id })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${active ? 'var(--md-primary, #123C69)' : 'var(--md-outline, #CBD5E1)'}`,
                        background: active ? 'var(--md-primary, #123C69)' : 'var(--md-surface, #FFFFFF)',
                        color: active ? '#FFFFFF' : 'var(--md-text-secondary, #475569)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(draft.meeting_modes === 'online' || draft.meeting_modes === 'both') && (
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Default Online Meeting Link (Zoom / Google Meet / Teams)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/your-room (can also be set per booking)"
                  value={draft.default_meeting_url}
                  onChange={(e) => onChange({ ...draft, default_meeting_url: e.target.value })}
                  style={inputStyle}
                />
              </div>
            )}

            {(draft.meeting_modes === 'offline' || draft.meeting_modes === 'both') && (
              <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Offline Cities Available (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Chattogram"
                    value={citiesInput}
                    onChange={(e) => {
                      setCitiesInput(e.target.value);
                      onChange({ ...draft, offline_cities: parseCsv(e.target.value) });
                    }}
                    style={inputStyle}
                  />
                </div>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Preferred Offline Area / Venue Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Gulshan / Banani coworking space"
                    value={draft.offline_notes}
                    onChange={(e) => onChange({ ...draft, offline_notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showCredentials && (
        <>
          {/* Portfolio, LinkedIn, GitHub */}
          <div style={sectionCardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px' }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>
                  <Globe size={13} />
                  <span>Portfolio URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.dev"
                  value={draft.portfolio_url}
                  onChange={(e) => onChange({ ...draft, portfolio_url: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>
                  <Link2 size={13} />
                  <span>LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={draft.linkedin_url}
                  onChange={(e) => onChange({ ...draft, linkedin_url: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={draft.github_url}
                  onChange={(e) => onChange({ ...draft, github_url: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Work Experiences */}
          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={labelStyle}>
                <Briefcase size={13} />
                <span>Work Experience Highlights</span>
              </label>
              <button
                type="button"
                onClick={addExperience}
                style={{
                  background: 'var(--md-surface, #FFFFFF)',
                  border: '1px solid var(--md-outline, #CBD5E1)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  color: 'var(--md-primary, #123C69)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={13} /> Add Role
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {draft.experiences.map((exp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-outline, #E2E8F0)',
                    background: 'var(--md-surface, #FFFFFF)',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Role title (e.g. Staff Engineer)"
                      value={exp.title}
                      onChange={(e) => updateExperience(idx, { title: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="Company & years (e.g. Acme · 2021–2026)"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, { company: e.target.value, period: exp.period || '' })}
                      style={inputStyle}
                    />
                    {draft.experiences.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove experience"
                        onClick={() => removeExperience(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Key impact or architecture ownership summary"
                    value={exp.summary}
                    onChange={(e) => updateExperience(idx, { summary: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CV Upload + CV Summary */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: '1.5px dashed var(--md-outline-variant, #94A3B8)',
              background: 'var(--md-surface-variant, #F8FAFC)',
              display: 'grid',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} color="var(--md-primary, #123C69)" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary, #0F172A)' }}>
                    Current CV / Resume (PDF or DOCX, max 5 MB)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--md-text-secondary, #64748B)' }}>
                    {draft.cv_filename || existingCvFilename || 'Upload your CV or enter a CV summary below'}
                  </div>
                </div>
              </div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '9px',
                  background: 'var(--md-surface, #FFFFFF)',
                  border: '1px solid var(--md-outline, #CBD5E1)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--md-primary, #123C69)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={14} />
                <span>{draft.cv_filename || existingCvFilename ? 'Replace CV' : 'Upload CV'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={fieldWrapStyle}>
              <label style={labelStyle}>CV Summary / Credentials (required if no file uploaded)</label>
              <textarea
                rows={3}
                placeholder="Summarize your education, certifications, publications, and notable achievements..."
                value={draft.cv_summary}
                onChange={(e) => onChange({ ...draft, cv_summary: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
