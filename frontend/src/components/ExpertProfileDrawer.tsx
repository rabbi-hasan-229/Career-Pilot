import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Lock,
  MapPin,
  Sparkles,
  Star,
  Video,
  X,
} from 'lucide-react';
import type {
  ExpertAvailabilitySlot,
  ExpertProfile,
  ExpertResourcePreview,
  ExpertReview,
} from '../types';
import { expertRepository, formatFileSize } from '../features/experts/expertRepository';
import { formatHourlyRate } from '../features/experts/expertMatching';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface Props {
  expert: ExpertProfile | null;
  isDemo?: boolean;
  onClose: () => void;
  onBook: (expert: ExpertProfile) => void;
  onToast: (msg: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeExternalUrl(raw?: string | null): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const ExpertProfileDrawer: React.FC<Props> = ({
  expert,
  isDemo = false,
  onClose,
  onBook,
  onToast,
}) => {
  const dialogRef = useAccessibleDialog(Boolean(expert), onClose);
  const [availability, setAvailability] = useState<ExpertAvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [resourcePreviews, setResourcePreviews] = useState<ExpertResourcePreview[]>([]);
  const [isOpeningCv, setIsOpeningCv] = useState(false);

  useEffect(() => {
    if (!expert) return;
    let active = true;
    void Promise.all([
      expertRepository.loadExpertAvailability(expert.user_id, isDemo).catch(() => []),
      expertRepository.loadExpertReviews(expert.user_id, isDemo).catch(() => []),
      expertRepository.listExpertResourcePreviews(expert.user_id, isDemo).catch(() => []),
    ]).then(([availRows, reviewRows, previewRows]) => {
      if (!active) return;
      setAvailability(availRows);
      setReviews(reviewRows);
      setResourcePreviews(previewRows);
    });
    return () => {
      active = false;
    };
  }, [expert, isDemo]);

  if (!expert) return null;

  const portfolioHref = normalizeExternalUrl(expert.portfolio_url);
  const linkedinHref = normalizeExternalUrl(expert.linkedin_url);
  const githubHref = normalizeExternalUrl(expert.github_url);
  const profileLinks = [
    portfolioHref ? { label: 'Portfolio', href: portfolioHref, icon: 'globe' as const } : null,
    linkedinHref ? { label: 'LinkedIn', href: linkedinHref, icon: 'external' as const } : null,
    githubHref ? { label: 'GitHub', href: githubHref, icon: 'external' as const } : null,
  ].filter((item): item is { label: string; href: string; icon: 'globe' | 'external' } => Boolean(item));

  const hasSpecializations =
    expert.categories.length > 0 || expert.target_roles.length > 0 || expert.skills.length > 0;

  const activeSlots = availability.filter((s) => s.is_active);

  const handleOpenCv = async () => {
    if (!expert.cv_storage_path) {
      onToast(
        expert.cv_summary
          ? 'Review the CV summary below (no downloadable PDF file attached).'
          : 'No downloadable CV file has been attached yet.'
      );
      return;
    }
    setIsOpeningCv(true);
    try {
      const signedUrl = await expertRepository.getExpertCVSignedUrl(expert.cv_storage_path);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not open expert CV.');
    } finally {
      setIsOpeningCv(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${expert.display_name} profile`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          background: 'var(--md-surface)',
          color: 'var(--md-text-primary)',
          borderLeft: '1px solid var(--md-outline)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 36px rgba(15, 23, 42, 0.16)',
        }}
      >
        {/* Pinned Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--md-outline)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <img
              src={expert.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(expert.display_name)}`}
              alt={expert.display_name}
              style={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                objectFit: 'cover',
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                  {expert.display_name}
                </h2>
                {expert.verification_tier === 'verified' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      color: 'var(--md-text-secondary)',
                    }}
                  >
                    <CheckCircle2 size={11} color="var(--md-primary)" /> Verified
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--md-text-secondary)', fontWeight: 600 }}>
                {expert.headline}
              </p>
              {(expert.current_company || expert.years_experience > 0) && (
                <div style={{ fontSize: '12px', color: 'var(--md-text-muted)', marginTop: '2px' }}>
                  {[expert.current_company, expert.years_experience > 0 ? `${expert.years_experience} yrs exp` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close expert profile"
            style={{
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Key metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                Hourly Wage
              </div>
              <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--md-primary)', marginTop: '2px' }}>
                {formatHourlyRate(expert.hourly_rate_cents)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                Rating
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span>{expert.rating_avg ? expert.rating_avg.toFixed(1) : 'New'}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--md-text-muted)', fontWeight: 600 }}>
                  ({expert.review_count})
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                Sessions
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '2px' }}>
                {expert.completed_sessions_count} completed
              </div>
            </div>
          </div>

          {/* Meeting Formats & Location */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
              }}
            >
              <Video size={13} />
              {expert.meeting_modes === 'both'
                ? 'Online & Offline Meetings'
                : expert.meeting_modes === 'online'
                  ? 'Online Video Sessions'
                  : 'In-Person Offline Sessions'}
            </span>
            {(expert.location || expert.offline_cities.length > 0) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  color: 'var(--md-text-secondary)',
                }}
              >
                <MapPin size={13} />
                {expert.offline_cities.length > 0 ? expert.offline_cities.join(', ') : expert.location}
              </span>
            )}
          </div>

          {/* Bio */}
          {expert.bio && (
            <section>
              <h3 style={{ margin: '0 0 6px', fontSize: '13.5px', fontWeight: 800 }}>About & Mentoring Style</h3>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--md-text-secondary)' }}>
                {expert.bio}
              </p>
            </section>
          )}

          {/* Specializations, Categories & Roles */}
          {hasSpecializations && (
            <section>
              <h3 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--md-primary)" /> Mentoring Focus & Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {expert.categories.map((cat) => (
                  <span
                    key={`cat-${cat}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '7px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline-variant)',
                      color: 'var(--md-text-primary)',
                    }}
                  >
                    {cat}
                  </span>
                ))}
                {expert.target_roles.map((role) => (
                  <span
                    key={`role-${role}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: 'var(--md-surface)',
                      border: '1px solid var(--md-outline)',
                      color: 'var(--md-text-primary)',
                    }}
                  >
                    {role}
                  </span>
                ))}
                {expert.skills.map((skill) => (
                  <span
                    key={`skill-${skill}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      color: 'var(--md-text-secondary)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Work Experience */}
          {expert.experiences.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color="var(--md-primary)" /> Work Experience
              </h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {expert.experiences.map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{exp.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '1px' }}>
                      {exp.company} {exp.period ? `· ${exp.period}` : ''}
                    </div>
                    {exp.summary && (
                      <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        {exp.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CV, Portfolio & Profile Links */}
          <section>
            <h3 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} color="var(--md-primary)" /> CV & Portfolio Links
            </h3>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                display: 'grid',
                gap: '10px',
              }}
            >
              {(expert.cv_storage_path || expert.cv_filename) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '9px',
                        background: 'var(--md-primary-container)',
                        color: 'var(--md-primary)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--md-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {expert.cv_filename || 'Curriculum Vitae'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                        {expert.cv_storage_path ? 'Verified resume document' : 'Filename on profile'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-m3-white"
                    onClick={() => void handleOpenCv()}
                    disabled={isOpeningCv}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>{isOpeningCv ? 'Opening...' : 'View CV'}</span>
                  </button>
                </div>
              )}

              {expert.cv_summary && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-secondary)', lineHeight: 1.55 }}>
                  {expert.cv_summary}
                </p>
              )}

              {!expert.cv_storage_path && !expert.cv_filename && !expert.cv_summary && profileLinks.length === 0 && (
                <div style={{ fontSize: '12.5px', color: 'var(--md-text-muted)' }}>
                  No CV document or portfolio links added yet.
                </div>
              )}

              {profileLinks.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: expert.cv_storage_path || expert.cv_filename || expert.cv_summary ? '8px' : 0,
                    borderTop:
                      expert.cv_storage_path || expert.cv_filename || expert.cv_summary
                        ? '1px solid var(--md-outline)'
                        : 'none',
                  }}
                >
                  {profileLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 11px',
                        borderRadius: '8px',
                        background: 'var(--md-surface)',
                        border: '1px solid var(--md-outline)',
                        color: 'var(--md-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      {link.icon === 'globe' ? <Globe size={13} /> : <ExternalLink size={12} />}
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Included Consultation Resources Preview */}
          {resourcePreviews.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FolderOpen size={14} color="var(--md-primary)" /> Included Resources ({resourcePreviews.length})
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-success)' }}>
                  Auto-unlocked on booking
                </span>
              </div>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                {resourcePreviews.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--md-surface)',
                      border: '1px solid var(--md-outline)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                        {item.resource_type === 'file'
                          ? `${item.file_name || 'File'}${item.file_size_bytes ? ` · ${formatFileSize(item.file_size_bytes)}` : ''}`
                          : 'External Resource Link'}
                      </div>
                    </div>
                    <Lock size={13} color="var(--md-text-muted)" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weekly Availability */}
          {activeSlots.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="var(--md-primary)" /> Weekly Availability ({expert.timezone})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {activeSlots.map((slot) => (
                  <span
                    key={slot.id}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={11} />
                    {DAY_NAMES[slot.day_of_week]} {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h3 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800 }}>Learner Reviews</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                      <span>{rev.learner_name}</span>
                      <span style={{ color: '#F59E0B' }}>{'★'.repeat(rev.rating)}</span>
                    </div>
                    {rev.comment && (
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Pinned Footer CTA */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--md-outline)',
            background: 'var(--md-surface)',
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn-m3-primary"
            onClick={() => onBook(expert)}
            style={{ flex: 1, padding: '12px 18px', fontSize: '14px', fontWeight: 700 }}
          >
            Book 1-on-1 Session ({formatHourlyRate(expert.hourly_rate_cents)})
          </button>
        </div>
      </div>
    </div>
  );
};
