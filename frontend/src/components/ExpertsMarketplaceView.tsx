import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  Link2,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Video,
} from 'lucide-react';
import type { ExpertBooking, ExpertProfile, ExpertResource, Profile } from '../types';
import { careerCategories } from '../features/roadmap/careerCatalog';
import { expertRepository, formatFileSize } from '../features/experts/expertRepository';
import { createRealtimeChannelName, syncSupabaseRealtimeAuth } from '../features/experts/sessionChatSync';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  formatCurrencyCents,
  formatHourlyRate,
  getCurrentIsoTimestamp,
  scoreExpertForCareerPath,
} from '../features/experts/expertMatching';
import { ExpertProfileDrawer } from './ExpertProfileDrawer';
import { ExpertBookingModal } from './ExpertBookingModal';
import { SessionChatDrawer } from './SessionChatDrawer';
import { CardGridSkeleton } from './SkeletonScreen';

interface Props {
  profile: Profile;
  initialChatBookingId?: string | null;
  onInitialChatHandled?: () => void;
  onOpenGoalSettings: () => void;
  onToast: (msg: string) => void;
}

export const ExpertsMarketplaceView: React.FC<Props> = ({
  profile,
  initialChatBookingId,
  onInitialChatHandled,
  onOpenGoalSettings,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'browse' | 'bookings'>('browse');
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [bookings, setBookings] = useState<ExpertBooking[]>([]);
  const [unlockedResources, setUnlockedResources] = useState<ExpertResource[]>([]);
  const [isSchemaMigrated, setIsSchemaMigrated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('matched');
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'price_asc'>('match');

  // Modals / Drawers
  const [inspectingExpert, setInspectingExpert] = useState<ExpertProfile | null>(null);
  const [bookingExpert, setBookingExpert] = useState<ExpertProfile | null>(null);
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<ExpertBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const chatBooking = useMemo(
    () => (chatBookingId ? bookings.find((b) => b.id === chatBookingId) ?? null : null),
    [bookings, chatBookingId]
  );

  useEffect(() => {
    if (!initialChatBookingId) return;
    setSubTab('bookings');
    setChatBookingId(initialChatBookingId);
    onInitialChatHandled?.();
  }, [initialChatBookingId, onInitialChatHandled]);

  const refreshLearnerBookings = useCallback(async () => {
    if (profile.is_demo || !isSupabaseConfigured()) return;
    try {
      const bookingRows = await expertRepository.loadLearnerBookings(profile.id);
      setBookings(bookingRows);
      const unlockedExpertIds = bookingRows
        .filter((b) => b.payment_status !== 'refunded' && b.expert_id)
        .map((b) => b.expert_id as string);
      if (unlockedExpertIds.length > 0) {
        const resRows = await expertRepository
          .listUnlockedResourcesForExperts(unlockedExpertIds, false)
          .catch(() => []);
        setUnlockedResources(resRows);
      }
    } catch {
      // Silent background sync
    }
  }, [profile.id, profile.is_demo]);

  // Realtime sync for learner bookings (confirmations, meeting links, completions)
  useEffect(() => {
    if (profile.is_demo || !isSupabaseConfigured()) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      await syncSupabaseRealtimeAuth();
      if (!active) return;

      channel = supabase
        .channel(createRealtimeChannelName('learner_bookings', profile.id))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expert_bookings',
            filter: `learner_id=eq.${profile.id}`,
          },
          () => {
            void refreshLearnerBookings();
          }
        )
        .subscribe((status) => {
          if (active && status === 'SUBSCRIBED') {
            void refreshLearnerBookings();
          }
        });
    };

    void connect();

    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refreshLearnerBookings();
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      active = false;
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [profile.id, profile.is_demo, refreshLearnerBookings]);

  useEffect(() => {
    let active = true;
    const isDemo = Boolean(profile.is_demo);

    void Promise.all([
      isDemo ? Promise.resolve(false) : expertRepository.isExpertMarketplaceMigrated(),
      expertRepository.listActiveExperts(isDemo),
      isDemo ? Promise.resolve([] as ExpertBooking[]) : expertRepository.loadLearnerBookings(profile.id),
    ])
      .then(async ([migrated, expertRows, bookingRows]) => {
        if (!active) return;
        setIsSchemaMigrated(isDemo ? true : migrated);
        setExperts(expertRows);
        setBookings(bookingRows);
        const unlockedExpertIds = bookingRows
          .filter((b) => b.payment_status !== 'refunded' && b.expert_id)
          .map((b) => b.expert_id as string);
        if (unlockedExpertIds.length > 0) {
          const resRows = await expertRepository
            .listUnlockedResourcesForExperts(unlockedExpertIds, isDemo)
            .catch(() => []);
          if (active) setUnlockedResources(resRows);
        }
      })
      .catch((err) => {
        if (active) onToast(err instanceof Error ? err.message : 'Could not load experts.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile.id, profile.is_demo, onToast]);

  const rankedExperts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return experts
      .map((expert) => ({
        expert,
        match: scoreExpertForCareerPath(
          expert,
          profile.target_role || '',
          profile.target_role_category
        ),
      }))
      .filter(({ expert, match }) => {
        if (selectedCategory === 'matched') {
          // Keep strong matches when any exist, otherwise show all matched by category/role
          if (profile.target_role_category && !expert.categories.includes(profile.target_role_category) && match.score < 20) {
            return false;
          }
        } else if (selectedCategory !== 'all') {
          if (!expert.categories.includes(selectedCategory as any)) return false;
        }

        if (modeFilter !== 'all') {
          if (expert.meeting_modes !== 'both' && expert.meeting_modes !== modeFilter) return false;
        }

        if (query) {
          const hay = `${expert.display_name} ${expert.headline} ${expert.skills.join(' ')} ${expert.target_roles.join(' ')} ${expert.location || ''}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.expert.rating_avg - a.expert.rating_avg;
        if (sortBy === 'price_asc') return a.expert.hourly_rate_cents - b.expert.hourly_rate_cents;
        if (b.match.score !== a.match.score) return b.match.score - a.match.score;
        return b.expert.rating_avg - a.expert.rating_avg;
      });
  }, [experts, profile.target_role, profile.target_role_category, searchQuery, selectedCategory, modeFilter, sortBy]);

  const handleConfirmCompleted = async (booking: ExpertBooking) => {
    setActionBusyId(booking.id);
    try {
      if (profile.is_demo || booking.id.startsWith('demo-bk-')) {
        const nowIso = getCurrentIsoTimestamp();
        const updated: ExpertBooking = {
          ...booking,
          status: 'completed',
          payment_status: 'released_to_expert',
          learner_confirmed_at: nowIso,
          released_at: nowIso,
        };
        setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
        setReviewBooking(updated);
        onToast('Session confirmed! Escrow payment released to the expert.');
        return;
      }
      const updated = await expertRepository.learnerConfirmSession(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
      setReviewBooking(updated);
      onToast('Session confirmed! Payment released to the expert wallet.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not confirm session.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCancelBooking = async (booking: ExpertBooking) => {
    setActionBusyId(booking.id);
    try {
      if (profile.is_demo || booking.id.startsWith('demo-bk-')) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? { ...b, status: 'cancelled_by_learner', payment_status: 'refunded' }
              : b
          )
        );
        onToast('Booking cancelled and payment marked for refund.');
        return;
      }
      const updated = await expertRepository.cancelBooking(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)));
      onToast('Booking cancelled and payment refunded via SSLCOMMERZ.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not cancel booking.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setActionBusyId(reviewBooking.id);
    try {
      if (!profile.is_demo && !reviewBooking.id.startsWith('demo-bk-')) {
        await expertRepository.submitReview(reviewBooking.id, reviewRating, reviewComment);
      }
      onToast('Thank you! Your review has been published.');
      setReviewBooking(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '16px 20px 88px', display: 'grid', gap: '16px' }}>
      {/* Career-Path Hero Header */}
      <section
        className="m3-surface-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'var(--md-primary-container)',
              color: 'var(--md-primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
              Industry Experts Marketplace
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--md-text-secondary)' }}>
              Matched to your career goal:{' '}
              <strong style={{ color: 'var(--md-primary)' }}>{profile.target_role || 'General'}</strong>
              {profile.target_role_category ? ` (${profile.target_role_category})` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-m3-white"
            onClick={onOpenGoalSettings}
            style={{ padding: '8px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Compass size={14} /> Change Career Path
          </button>
        </div>
      </section>

      {!profile.is_demo && !isSchemaMigrated && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--md-warning-bg)',
            border: '1px solid var(--md-warning)',
            color: 'var(--md-text-primary)',
            fontSize: '12.5px',
            lineHeight: 1.5,
          }}
        >
          <strong>Preview Mode (Supabase migration pending):</strong> Run{' '}
          <code>supabase/migrations/20261122000000_expert_marketplace_wallet.sql</code> on your Supabase project to persist live expert profiles, bookings, and wallet withdrawals. Showing sample mentors below.
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSubTab('browse')}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: `1px solid ${subTab === 'browse' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
            background: subTab === 'browse' ? 'var(--md-primary)' : 'var(--md-surface)',
            color: subTab === 'browse' ? '#FFFFFF' : 'var(--md-text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Find Experts ({rankedExperts.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('bookings')}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: `1px solid ${subTab === 'bookings' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
            background: subTab === 'bookings' ? 'var(--md-primary)' : 'var(--md-surface)',
            color: subTab === 'bookings' ? '#FFFFFF' : 'var(--md-text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          My Sessions & Bookings ({bookings.length})
        </button>
      </div>

      {subTab === 'browse' ? (
        <>
          {/* Filter Bar */}
          <section
            className="m3-surface-card"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '10px', padding: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)' }}>
              <Search size={15} color="var(--md-text-muted)" />
              <input
                type="text"
                placeholder="Search name, skill, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--md-text-primary)', fontSize: '13px', width: '100%' }}
              />
            </div>

            <select
              aria-label="Filter by career category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)', color: 'var(--md-text-primary)', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="matched">Recommended for {profile.target_role || 'Career Goal'}</option>
              <option value="all">All Categories</option>
              {careerCategories.filter((c) => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by meeting mode"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'all' | 'online' | 'offline')}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)', color: 'var(--md-text-primary)', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="all">Online & Offline</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline In-Person</option>
            </select>

            <select
              aria-label="Sort experts"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'rating' | 'price_asc')}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)', color: 'var(--md-text-primary)', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="match">Best Career Match</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Lowest Hourly Rate</option>
            </select>
          </section>

          {/* Experts Grid */}
          {isLoading ? (
            <CardGridSkeleton count={3} label="Loading matched experts" />
          ) : rankedExperts.length === 0 ? (
            <div className="m3-surface-card" style={{ textAlign: 'center', padding: '32px' }}>
              <Filter size={28} color="var(--md-text-muted)" style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>No matching experts for this filter</h3>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--md-text-secondary)' }}>
                Try switching the category filter to All Categories to browse experts across all domains.
              </p>
              <button
                type="button"
                className="btn-m3-primary"
                onClick={() => {
                  setSelectedCategory('all');
                  setModeFilter('all');
                  setSearchQuery('');
                }}
              >
                Show All Experts
              </button>
            </div>
          ) : (
            <div className="expert-grid">
              {rankedExperts.map(({ expert, match }) => {
                const primaryExp = expert.experiences[0];
                const credentialTags = [
                  ...expert.categories.slice(0, 2),
                  ...expert.target_roles.slice(0, 2),
                  ...expert.skills.slice(0, 3),
                ];
                const uniqueTags = Array.from(new Set(credentialTags)).slice(0, 5);
                const extraTagCount = Math.max(
                  0,
                  new Set([...expert.categories, ...expert.target_roles, ...expert.skills]).size - uniqueTags.length
                );

                return (
                  <article
                    key={expert.user_id}
                    className="m3-surface-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '18px',
                      border: '1px solid var(--md-outline)',
                    }}
                  >
                    {/* Header: Identity & Hourly Rate */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <img
                          src={expert.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(expert.display_name)}`}
                          alt={expert.display_name}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: '12px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            background: 'var(--md-surface-variant)',
                            border: '1px solid var(--md-outline)',
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '15.5px',
                                fontWeight: 800,
                                color: 'var(--md-text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {expert.display_name}
                            </h3>
                            {expert.verification_tier === 'verified' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  color: 'var(--md-text-secondary)',
                                  border: '1px solid var(--md-outline)',
                                  padding: '1px 6px',
                                  borderRadius: '9999px',
                                }}
                                aria-label="Verified expert"
                              >
                                <CheckCircle2 size={11} color="var(--md-primary)" /> Verified
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                            {expert.headline}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', lineHeight: 1.1 }}>
                          {formatHourlyRate(expert.hourly_rate_cents).replace('/hr', '')}
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--md-text-muted)' }}>/hr</span>
                        </div>
                      </div>
                    </div>

                    {/* Structured Credentials Summary */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px 14px',
                        fontSize: '12px',
                        color: 'var(--md-text-secondary)',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'var(--md-surface-variant)',
                        border: '1px solid var(--md-outline)',
                      }}
                    >
                      {(expert.current_company || expert.years_experience > 0) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                          <Briefcase size={12} color="var(--md-text-muted)" />
                          {[expert.current_company, expert.years_experience > 0 ? `${expert.years_experience} yrs exp` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                      {(expert.location || expert.offline_cities.length > 0) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={12} color="var(--md-text-muted)" />
                          {expert.location || expert.offline_cities[0]}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Star size={12} color="var(--md-text-primary)" fill="var(--md-text-primary)" />
                        {expert.rating_avg ? expert.rating_avg.toFixed(1) : 'New'} ({expert.review_count}) · {expert.completed_sessions_count} sessions
                      </span>
                    </div>

                    {/* Bio & Latest Role Context */}
                    <div style={{ display: 'grid', gap: '5px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12.5px',
                          color: 'var(--md-text-secondary)',
                          lineHeight: 1.55,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {expert.bio || expert.cv_summary}
                      </p>
                      {primaryExp && (primaryExp.title || primaryExp.company) && (
                        <div style={{ fontSize: '11.5px', color: 'var(--md-text-muted)' }}>
                          Experience: <strong style={{ color: 'var(--md-text-secondary)', fontWeight: 600 }}>{primaryExp.title}</strong>
                          {primaryExp.company ? ` at ${primaryExp.company}` : ''}
                          {primaryExp.period ? ` (${primaryExp.period})` : ''}
                        </div>
                      )}
                    </div>

                    {/* Specializations & Mentored Roles (Neutral Palette) */}
                    {uniqueTags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {uniqueTags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--md-text-secondary)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'var(--md-surface-variant)',
                              border: '1px solid var(--md-outline)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {extraTagCount > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--md-text-muted)', padding: '3px 4px', fontWeight: 600 }}>
                            +{extraTagCount} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Detailed Session & Credential Strip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        fontSize: '11.5px',
                        color: 'var(--md-text-secondary)',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--md-outline)',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {expert.meeting_modes === 'offline' ? <MapPin size={12} /> : <Video size={12} />}
                        {expert.meeting_modes === 'both'
                          ? 'Online & Offline'
                          : expert.meeting_modes === 'online'
                            ? 'Online Video'
                            : `In-Person (${expert.offline_cities[0] || 'Local'})`}
                        <span style={{ color: 'var(--md-text-muted)' }}>·</span>
                        <Clock size={12} /> Up to {expert.max_hours_per_session}h
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--md-text-muted)' }}>
                        {(expert.cv_filename || expert.cv_storage_path) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FileText size={11} /> CV
                          </span>
                        )}
                        {match.matchReasons[0] && (
                          <span style={{ fontWeight: 600, color: 'var(--md-text-secondary)' }}>
                            {match.matchReasons[0]}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '2px' }}>
                      <button
                        type="button"
                        className="btn-m3-white"
                        onClick={() => setInspectingExpert(expert)}
                        style={{ flex: 1, padding: '9px 12px', fontSize: '12.5px', fontWeight: 700 }}
                      >
                        Profile & CV
                      </button>
                      <button
                        type="button"
                        className="btn-m3-primary"
                        onClick={() => setBookingExpert(expert)}
                        style={{ flex: 1.2, padding: '9px 12px', fontSize: '12.5px', fontWeight: 700 }}
                      >
                        Book Session
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Bookings Tab */
        <section style={{ display: 'grid', gap: '12px' }}>
          {bookings.length === 0 ? (
            <div className="m3-surface-card" style={{ textAlign: 'center', padding: '32px' }}>
              <Calendar size={28} color="var(--md-text-muted)" style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>No sessions booked yet</h3>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--md-text-secondary)' }}>
                Browse industry experts matched to your {profile.target_role} career goal and schedule a 1-on-1 session.
              </p>
              <button type="button" className="btn-m3-primary" onClick={() => setSubTab('browse')}>
                Browse Experts
              </button>
            </div>
          ) : (
            bookings.map((booking) => {
              const isBusy = actionBusyId === booking.id;
              const startStr = new Date(booking.scheduled_start).toLocaleString();
              return (
                <div
                  key={booking.id}
                  className="m3-surface-card"
                  style={{ display: 'grid', gap: '10px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
                        {booking.expert_name_snapshot} · {booking.hours}h {booking.meeting_mode.toUpperCase()}
                      </h3>
                      <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
                        {startStr} ({booking.timezone})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background:
                            booking.status === 'completed'
                              ? 'var(--md-success-bg)'
                              : booking.status.startsWith('cancelled')
                                ? 'var(--md-error-bg)'
                                : 'var(--md-primary-container)',
                          color:
                            booking.status === 'completed'
                              ? 'var(--md-success)'
                              : booking.status.startsWith('cancelled')
                                ? 'var(--md-error)'
                                : 'var(--md-primary)',
                        }}
                      >
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>
                        {formatCurrencyCents(booking.gross_amount_cents)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--md-text-secondary)' }}>
                    <strong>Agenda:</strong> {booking.topic}
                  </div>
                  {booking.payment_method && (
                    <div style={{ fontSize: '11.5px', color: 'var(--md-text-muted)' }}>
                      Paid via <strong>{booking.payment_method}</strong>
                      {booking.payment_reference ? ` · Ref: ${booking.payment_reference}` : ''}
                    </div>
                  )}

                  {booking.meeting_mode === 'online' && booking.meeting_url && booking.status === 'confirmed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={booking.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-m3-primary"
                        style={{
                          padding: '7px 14px',
                          fontSize: '12.5px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ExternalLink size={14} /> Join Online Meeting
                      </a>
                    </div>
                  )}

                  {booking.meeting_mode === 'offline' && (
                    <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} />
                      <span>
                        <strong>In-person:</strong> {booking.offline_city || 'City TBD'}
                        {booking.offline_venue ? ` — ${booking.offline_venue}` : ' (venue pending expert confirmation)'}
                      </span>
                    </div>
                  )}

                  {booking.payment_status !== 'refunded' && (() => {
                    const bookingResources = unlockedResources.filter((r) => r.expert_id === booking.expert_id);
                    if (bookingResources.length === 0) return null;
                    return (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface-variant)',
                          display: 'grid',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--md-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FolderOpen size={14} /> Unlocked Consultation Resources ({bookingResources.length})
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {bookingResources.map((res) => (
                            <div
                              key={res.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                flexWrap: 'wrap',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                background: 'var(--md-surface)',
                                border: '1px solid var(--md-outline)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                {res.resource_type === 'file' ? <FileText size={14} color="var(--md-primary)" /> : <Link2 size={14} color="var(--md-primary)" />}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{res.title}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                                    {res.resource_type === 'file'
                                      ? `${res.file_name || 'Downloadable File'}${res.file_size_bytes ? ` · ${formatFileSize(res.file_size_bytes)}` : ''}`
                                      : 'Resource Link'}
                                    {res.description ? ` — ${res.description}` : ''}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn-m3-white"
                                onClick={async () => {
                                  try {
                                    if (res.storage_path) {
                                      const url = await expertRepository.getExpertResourceSignedUrl(res.storage_path);
                                      window.open(url, '_blank', 'noopener,noreferrer');
                                    } else if (res.external_url) {
                                      window.open(res.external_url, '_blank', 'noopener,noreferrer');
                                    }
                                  } catch (err) {
                                    onToast(err instanceof Error ? err.message : 'Could not open resource.');
                                  }
                                }}
                                style={{ padding: '5px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                {res.storage_path ? <Download size={12} /> : <ExternalLink size={12} />}
                                <span>{res.storage_path ? 'Download' : 'Open'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-m3-white"
                      onClick={() => setChatBookingId(booking.id)}
                      style={{ padding: '7px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <MessageSquare size={13} /> Session Chat
                    </button>

                    {booking.status === 'confirmed' && (
                      <button
                        type="button"
                        className="btn-m3-primary"
                        disabled={isBusy}
                        onClick={() => void handleConfirmCompleted(booking)}
                        style={{ padding: '7px 14px', fontSize: '12px' }}
                      >
                        {isBusy ? 'Releasing...' : 'Confirm Session Completed & Release Payment'}
                      </button>
                    )}

                    {(booking.status === 'pending_confirmation' || booking.status === 'confirmed') && (
                      <button
                        type="button"
                        className="btn-m3-white"
                        disabled={isBusy}
                        onClick={() => void handleCancelBooking(booking)}
                        style={{ padding: '7px 12px', fontSize: '12px', color: 'var(--md-error)' }}
                      >
                        Cancel & Refund
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <button
                        type="button"
                        className="btn-m3-white"
                        onClick={() => setReviewBooking(booking)}
                        style={{ padding: '7px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Star size={13} /> Leave Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Drawers & Modals */}
      <ExpertProfileDrawer
        expert={inspectingExpert}
        isDemo={Boolean(profile.is_demo)}
        onClose={() => setInspectingExpert(null)}
        onBook={(exp) => {
          setInspectingExpert(null);
          setBookingExpert(exp);
        }}
        onToast={onToast}
      />

      <ExpertBookingModal
        key={bookingExpert?.user_id || 'booking-closed'}
        expert={bookingExpert}
        learnerProfile={profile}
        onBooked={async (newBooking) => {
          setBookings((prev) => [newBooking, ...prev]);
          setSubTab('bookings');
          if (newBooking.expert_id) {
            const resRows = await expertRepository
              .listUnlockedResourcesForExperts([newBooking.expert_id], Boolean(profile.is_demo))
              .catch(() => []);
            if (resRows.length > 0) {
              setUnlockedResources((prev) => {
                const seen = new Set(prev.map((r) => r.id));
                return [...prev, ...resRows.filter((r) => !seen.has(r.id))];
              });
              onToast(`Unlocked ${resRows.length} expert consultation resource(s) in My Sessions & Bookings!`);
            }
          }
        }}
        onClose={() => setBookingExpert(null)}
        onToast={onToast}
      />

      <SessionChatDrawer
        key={chatBooking?.id || 'chat-closed'}
        booking={chatBooking}
        currentUserId={profile.id}
        currentUserName={profile.full_name}
        isDemo={Boolean(profile.is_demo)}
        onClose={() => setChatBookingId(null)}
        onToast={onToast}
      />

      {/* Review Modal */}
      {reviewBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1600,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={() => setReviewBooking(null)}
        >
          <form
            onSubmit={handleSubmitReview}
            onClick={(e) => e.stopPropagation()}
            className="m3-surface-card"
            style={{ width: '100%', maxWidth: '420px', display: 'grid', gap: '12px' }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Rate Session with {reviewBooking.expert_name_snapshot}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <Star
                    size={24}
                    fill={star <= reviewRating ? '#F59E0B' : 'none'}
                    color={star <= reviewRating ? '#F59E0B' : 'var(--md-text-muted)'}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="How was the mentoring session?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-m3-white" onClick={() => setReviewBooking(null)}>
                Skip
              </button>
              <button type="submit" className="btn-m3-primary" disabled={actionBusyId === reviewBooking.id}>
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
