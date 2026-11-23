import React from 'react';
import { CheckCircle2, ExternalLink, FileText, MapPin, Pencil } from 'lucide-react';
import type { ExpertMeetingModes, ExpertProfile } from '../types';
import { formatHourlyRate } from '../features/experts/expertMatching';

interface Props {
  expertProfile: ExpertProfile;
  fallbackAvatarUrl?: string | null;
  onEditProfile?: () => void;
}

const MODE_LABELS: Record<ExpertMeetingModes, string> = {
  online: 'Online',
  offline: 'Offline',
  both: 'Online & Offline',
};

/**
 * Compact, minimalist card presenting the expert's public intro, role metadata,
 * mentoring rate, and key links on the Expert Dashboard.
 */
export const ExpertIntroCard: React.FC<Props> = ({
  expertProfile,
  fallbackAvatarUrl,
  onEditProfile,
}) => {
  const avatarSrc =
    expertProfile.avatar_url ||
    fallbackAvatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(expertProfile.display_name)}`;

  const metaParts = [
    expertProfile.current_company?.trim(),
    expertProfile.location?.trim(),
    expertProfile.years_experience > 0 ? `${expertProfile.years_experience}y exp` : null,
  ].filter((part): part is string => Boolean(part));

  const tags = [
    ...expertProfile.categories.slice(0, 2),
    ...expertProfile.skills.slice(0, 4),
  ];
  const extraSkillCount = Math.max(0, expertProfile.skills.length - 4);

  const profileLinks = [
    expertProfile.portfolio_url ? { label: 'Portfolio', href: expertProfile.portfolio_url } : null,
    expertProfile.linkedin_url ? { label: 'LinkedIn', href: expertProfile.linkedin_url } : null,
    expertProfile.github_url ? { label: 'GitHub', href: expertProfile.github_url } : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  return (
    <section
      aria-label="Expert intro summary"
      className="m3-surface-card"
      style={{
        padding: '16px 18px',
        display: 'grid',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 260px' }}>
          <img
            src={avatarSrc}
            alt={expertProfile.display_name}
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1px solid var(--md-outline)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: 800,
                  color: 'var(--md-text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {expertProfile.display_name}
              </h2>
              {expertProfile.verification_tier === 'verified' ? (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--md-success)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <CheckCircle2 size={11} /> Verified
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: 'var(--md-text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  · {expertProfile.status}
                </span>
              )}
            </div>

            {expertProfile.headline && (
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--md-text-primary)',
                  marginTop: '1px',
                }}
              >
                {expertProfile.headline}
              </div>
            )}

            {metaParts.length > 0 && (
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--md-text-muted)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexWrap: 'wrap',
                }}
              >
                {expertProfile.location?.trim() && <MapPin size={11} />}
                <span>{metaParts.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--md-primary)',
              background: 'var(--md-primary-container)',
              padding: '4px 10px',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
            }}
          >
            {formatHourlyRate(expertProfile.hourly_rate_cents)} · {MODE_LABELS[expertProfile.meeting_modes]}
          </span>
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="btn-m3-white"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '11.5px',
              }}
            >
              <Pencil size={12} /> Edit Intro
            </button>
          )}
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: 1.55,
          color: expertProfile.bio.trim() ? 'var(--md-text-secondary)' : 'var(--md-text-muted)',
        }}
      >
        {expertProfile.bio.trim()
          ? expertProfile.bio.trim()
          : 'Add a short mentoring intro to share your background and session focus with learners.'}
      </p>

      {(tags.length > 0 || profileLinks.length > 0 || expertProfile.cv_filename) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            paddingTop: '4px',
            borderTop: '1px solid var(--md-outline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--md-text-secondary)',
                  background: 'var(--md-surface-variant)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {tag}
              </span>
            ))}
            {extraSkillCount > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--md-text-muted)', fontWeight: 600 }}>
                +{extraSkillCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {expertProfile.cv_filename && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--md-text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FileText size={12} /> {expertProfile.cv_filename}
              </span>
            )}
            {profileLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--md-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {link.label} <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
