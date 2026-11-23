import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Globe,
  LoaderCircle,
  Lock,
  MapPin,
  PlusCircle,
  Search,
} from 'lucide-react';
import type { Milestone, Skill, Task, Vacancy } from '../types';
import { supabase } from '../lib/supabase';
import { createCustomCareerBlueprint, findCuratedCareerBlueprint } from '../features/roadmap/careerCatalog';
import type { CareerCategory } from '../features/roadmap/careerCatalog';
import { LearningResourcesPanel } from '../features/resources/LearningResourcesPanel';
import {
  buildProgressionSkillsList,
  computeRoadmapJobMarketProgression,
  MINIMUM_JOB_MARKET_PROGRESS_PCT,
} from '../features/roadmap/jobMarketProgress';
import { CardGridSkeleton } from './SkeletonScreen';

interface Props {
  userId: string;
  targetRole: string;
  targetRoleCategory?: CareerCategory;
  milestones?: Milestone[];
  tasks?: Task[];
  onNavigateToRoadmap?: () => void;
  onAddSkillToRoadmap?: (skillName: string) => Promise<void> | void;
  onAddResourceToRoadmap?: (resource: { id: string; title: string; category: CareerCategory | null }) => Promise<boolean>;
  onToast: (msg: string) => void;
}

interface RemoteJobsResponse {
  source: string;
  fetched_at: string;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    salary_range: string;
    source_url: string;
    published_at: string | null;
    tags: string[];
    description: string;
  }>;
}

type LiveSearchMode = 'remote' | 'regional' | 'hybrid';

const GLOBAL_MARKET_REGIONS = [
  { id: 'worldwide', label: 'Worldwide Remote', mode: 'remote' as LiveSearchMode, location: '' },
  { id: 'europe', label: 'Europe', mode: 'regional' as LiveSearchMode, location: 'Europe' },
  { id: 'north_america', label: 'North America', mode: 'regional' as LiveSearchMode, location: 'United States' },
  { id: 'asia_pacific', label: 'Asia-Pacific', mode: 'regional' as LiveSearchMode, location: 'Singapore' },
  { id: 'bangladesh', label: 'Bangladesh', mode: 'regional' as LiveSearchMode, location: 'Dhaka, Bangladesh' },
] as const;

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function skillIsMentioned(searchableText: string, skillName: string): boolean {
  const normalized = normalizeSearchText(searchableText);
  const skill = normalizeSearchText(skillName);
  if (!skill || skill.length < 2) return false;
  const withoutVersion = skill.replace(/\b\d+(?:\.\d+)*\b/g, '').trim();
  return [skill, withoutVersion].filter((phrase) => phrase.length >= 2).some((phrase) => ` ${normalized} `.includes(` ${phrase} `));
}

function buildGlobalCircularFallback(
  roleTitle: string,
  achievedSkills: string[],
  upcomingSkills: string[],
  locationFilter: string
): Vacancy[] {
  const cleanLocation = locationFilter.trim();
  const topAchieved = achievedSkills.slice(0, 4);
  const queryTerms = [roleTitle, ...achievedSkills.slice(0, 2)].filter(Boolean).join(' ');
  const encodedQuery = encodeURIComponent(queryTerms);
  const encodedRole = encodeURIComponent(roleTitle);
  const encodedLoc = encodeURIComponent(cleanLocation || 'Remote');

  const sampleCards: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    required: string[];
    url: string;
  }> = [
    {
      id: 'global-remote-match',
      title: `${roleTitle} (Skills-Matched)`,
      company: 'LinkedIn Global Jobs',
      location: cleanLocation || 'Worldwide · Remote / Distributed',
      salary: 'Market Rate · Global',
      required: [...topAchieved, ...upcomingSkills.slice(0, 1)].filter(Boolean),
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLoc}`,
    },
    {
      id: 'global-hub-europe-us',
      title: `${roleTitle} · International Circulars`,
      company: 'Remote OK Global Feed',
      location: cleanLocation || 'Americas / EMEA · Remote',
      salary: 'USD / EUR Benchmark',
      required: [...topAchieved.slice(0, 3), ...upcomingSkills.slice(0, 2)].filter(Boolean),
      url: `https://remoteok.com/remote-${encodedRole.toLowerCase().replace(/%20+/g, '-')}-jobs`,
    },
    {
      id: 'global-associate-junior',
      title: `Junior / Mid ${roleTitle}`,
      company: 'Indeed Worldwide Circulars',
      location: cleanLocation || 'Asia-Pacific & Global Hybrid',
      salary: 'Entry to Mid Range',
      required: [...topAchieved.slice(0, 2)].filter(Boolean),
      url: `https://www.indeed.com/jobs?q=${encodedQuery}&l=${encodedLoc}`,
    },
  ];

  const achievedLower = new Set(achievedSkills.map((s) => s.toLowerCase()));
  return sampleCards
    .filter((card) => card.required.length > 0)
    .map((card) => {
      const missing = card.required.filter((skill) => !achievedLower.has(skill.toLowerCase()));
      const matchPct = Math.round(((card.required.length - missing.length) / card.required.length) * 100);
      return {
        id: card.id,
        title: card.title,
        company: card.company,
        location: card.location,
        salary_range: card.salary,
        match_pct: matchPct,
        required_skills: card.required,
        missing_skills: missing,
        source_type: 'sample' as const,
        source_url: card.url,
      };
    });
}

async function findRemoteJobs(
  query: string,
  category: CareerCategory,
  progressionSkills: Skill[],
  mode: LiveSearchMode = 'remote',
  location = '',
): Promise<{ response: RemoteJobsResponse; vacancies: Vacancy[] }> {
  const result = await supabase.functions.invoke('search-remote-jobs', {
    body: {
      query,
      category,
      skills: progressionSkills.map((skill) => skill.name).slice(0, 20),
      mode,
      location,
    },
  });
  if (result.error) {
    const context = (result.error as Error & { context?: unknown }).context;
    if (context instanceof Response) {
      let message: string | undefined;
      try {
        const payload = await context.clone().json() as { error?: string; request_id?: string };
        const requestId = payload.request_id || context.headers.get('x-request-id');
        message = payload.error ? `${payload.error}${requestId ? ` (Reference: ${requestId})` : ''}` : undefined;
      } catch { /* Use the Supabase SDK error if the response is not JSON. */ }
      if (message) throw new Error(message);
    }
    throw new Error(result.error.message || 'Global job search failed.');
  }
  if (!result.data || typeof result.data !== 'object') {
    throw new Error('The global job feed returned an invalid response.');
  }
  const payload = result.data as Partial<RemoteJobsResponse> & { error?: string };
  if (payload.error) throw new Error(payload.error);
  if (!Array.isArray(payload.jobs) || typeof payload.fetched_at !== 'string' || typeof payload.source !== 'string') {
    throw new Error('The live job source returned incomplete data.');
  }
  const sourceName = payload.source || 'Remote OK';

  const vacancies = payload.jobs.map((job) => {
    const searchable = `${job.title} ${job.tags.join(' ')} ${job.description}`;
    const required = progressionSkills.filter((skill) => skillIsMentioned(searchable, skill.name));
    const acquired = required.filter((skill) => skill.is_acquired);
    const missing = required.filter((skill) => !skill.is_acquired);
    const matchPct = required.length
      ? Math.round((acquired.length / required.length) * 100)
      : null;

    return {
      id: `${sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
      title: job.title,
      company: job.company,
      location: job.location || 'Worldwide · Remote',
      salary_range: job.salary_range || 'Salary not provided',
      match_pct: matchPct,
      required_skills: required.map((skill) => skill.name),
      missing_skills: missing.map((skill) => skill.name),
      source_type: sourceName === 'Jooble' ? 'jooble' as const : 'remoteok' as const,
      source_url: job.source_url,
      published_at: job.published_at,
    };
  });

  // Sort highest achieved-skill match first, then newest date
  vacancies.sort((a, b) => {
    const scoreA = a.match_pct ?? -1;
    const scoreB = b.match_pct ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return Date.parse(b.published_at || '') - Date.parse(a.published_at || '');
  });

  return { response: payload as RemoteJobsResponse, vacancies };
}

export const SkillGapView: React.FC<Props> = ({
  targetRole,
  targetRoleCategory,
  milestones = [],
  tasks = [],
  onNavigateToRoadmap,
  onAddSkillToRoadmap,
  onAddResourceToRoadmap,
  onToast,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'market' | 'resources'>('market');
  const [filterMode, setFilterMode] = useState<'all' | 'strong_match'>('all');
  const [liveVacancies, setLiveVacancies] = useState<Vacancy[]>([]);
  const [liveQuery, setLiveQuery] = useState(targetRole);
  const [liveSearchMode, setLiveSearchMode] = useState<LiveSearchMode>('remote');
  const [liveLocation, setLiveLocation] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [liveFetchedAt, setLiveFetchedAt] = useState('');
  const [showAllUpcomingSkills, setShowAllUpcomingSkills] = useState(false);
  const liveSearchRequest = useRef(0);

  const curatedRole = useMemo(() => findCuratedCareerBlueprint(targetRole), [targetRole]);
  const roleBlueprint = useMemo(
    () => curatedRole || createCustomCareerBlueprint(targetRole, targetRoleCategory),
    [curatedRole, targetRole, targetRoleCategory]
  );

  const progression = useMemo(
    () => computeRoadmapJobMarketProgression(milestones, tasks, targetRole, targetRoleCategory),
    [milestones, tasks, targetRole, targetRoleCategory]
  );

  const progressionSkills = useMemo(
    () => buildProgressionSkillsList(progression),
    [progression]
  );

  // Fetch global job circulars automatically only once >=20% roadmap progression is complete
  useEffect(() => {
    let active = true;
    if (workspaceTab !== 'market' || !progression.isUnlocked) {
      liveSearchRequest.current += 1;
      return () => {
        active = false;
      };
    }

    const requestId = ++liveSearchRequest.current;
    void Promise.resolve().then(async () => {
      if (!active || requestId !== liveSearchRequest.current) return;
      setLiveLoading(true);
      setLiveError('');
      try {
        const remote = await findRemoteJobs(
          targetRole,
          roleBlueprint.category,
          progressionSkills,
          'remote',
          ''
        );
        if (!active || requestId !== liveSearchRequest.current) return;
        setLiveVacancies(remote.vacancies);
        setLiveFetchedAt(remote.response.fetched_at);
      } catch {
        if (!active || requestId !== liveSearchRequest.current) return;
        setLiveVacancies([]);
        setLiveError('Live remote search is offline — showing global job search portals matched to your achieved skills.');
      } finally {
        if (active && requestId === liveSearchRequest.current) setLiveLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [workspaceTab, progression.isUnlocked, targetRole, roleBlueprint.category, progressionSkills]);

  const fallbackPortals = useMemo(
    () =>
      progression.isUnlocked
        ? buildGlobalCircularFallback(
            liveQuery.trim() || targetRole,
            progression.achievedSkills,
            progression.upcomingSkills,
            liveLocation
          )
        : [],
    [progression.isUnlocked, liveQuery, targetRole, progression.achievedSkills, progression.upcomingSkills, liveLocation]
  );

  const combinedCirculars = useMemo(() => {
    if (liveVacancies.length > 0) return liveVacancies;
    return fallbackPortals;
  }, [liveVacancies, fallbackPortals]);

  const displayedCirculars = useMemo(
    () =>
      filterMode === 'strong_match'
        ? combinedCirculars.filter((v) => v.match_pct !== null && v.match_pct >= 50)
        : combinedCirculars,
    [combinedCirculars, filterMode]
  );

  const executeLiveSearch = async (
    mode: LiveSearchMode,
    queryText: string,
    locationText: string
  ) => {
    if (!progression.isUnlocked) return;
    const cleanQuery = queryText.trim();
    const cleanLocation = locationText.trim();
    if (cleanQuery.length < 2) {
      setLiveError('Enter at least 2 characters for the job title.');
      return;
    }
    if (mode !== 'remote' && cleanLocation.length < 2) {
      setLiveError('Enter a city, country, or region (e.g. Europe, London, Dhaka) to search.');
      return;
    }

    const requestId = ++liveSearchRequest.current;
    setLiveLoading(true);
    setLiveError('');
    try {
      const remote = await findRemoteJobs(
        cleanQuery,
        roleBlueprint.category,
        progressionSkills,
        mode,
        cleanLocation
      );
      if (requestId !== liveSearchRequest.current) return;
      setLiveVacancies(remote.vacancies);
      setLiveFetchedAt(remote.response.fetched_at);
    } catch (remoteError) {
      if (requestId !== liveSearchRequest.current) return;
      setLiveVacancies([]);
      setLiveError(
        remoteError instanceof Error
          ? `${remoteError.message} Showing matched global job search links below.`
          : 'Live global search is temporarily unavailable.'
      );
    } finally {
      if (requestId === liveSearchRequest.current) setLiveLoading(false);
    }
  };

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (liveLoading) return;
    await executeLiveSearch(liveSearchMode, liveQuery, liveLocation);
  };

  const handleRegionPreset = (region: (typeof GLOBAL_MARKET_REGIONS)[number]) => {
    setLiveSearchMode(region.mode);
    setLiveLocation(region.location);
    setLiveError('');
    if (progression.isUnlocked) {
      void executeLiveSearch(region.mode, liveQuery || targetRole, region.location);
    }
  };

  const handleQueueSkill = async (skill: string) => {
    try {
      await onAddSkillToRoadmap?.(skill);
      onToast(`"${skill}" added to your roadmap.`);
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not add this skill to your roadmap.');
    }
  };

  const handleQueueResource = async (resource: { id: string; title: string; category: CareerCategory | null }): Promise<boolean> => {
    if (!onAddResourceToRoadmap) throw new Error('Resource tasks are unavailable right now.');
    try {
      const added = await onAddResourceToRoadmap(resource);
      return added;
    } catch (resourceError) {
      onToast(resourceError instanceof Error ? resourceError.message : 'Could not add this resource to your roadmap.');
      throw resourceError;
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Workspace Tabs */}
      <div
        role="group"
        aria-label="Job Market workspace"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--md-outline)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          aria-pressed={workspaceTab === 'market'}
          onClick={() => setWorkspaceTab('market')}
          className={`m3-tab-pill ${workspaceTab === 'market' ? 'active' : ''}`}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <Briefcase size={15} aria-hidden="true" /> Job Market
        </button>
        <button
          type="button"
          aria-pressed={workspaceTab === 'resources'}
          onClick={() => setWorkspaceTab('resources')}
          className={`m3-tab-pill ${workspaceTab === 'resources' ? 'active' : ''}`}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <BookOpen size={15} aria-hidden="true" /> Learning Resources
        </button>
      </div>

      {workspaceTab === 'resources' ? (
        <LearningResourcesPanel
          key={`${targetRole}:${targetRoleCategory || ''}`}
          targetRole={targetRole}
          targetRoleCategory={targetRoleCategory}
          onAddToPlan={handleQueueResource}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="m3-surface-card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      color: 'var(--md-text-secondary)',
                      padding: '2px 9px',
                      borderRadius: '9999px',
                    }}
                  >
                    {roleBlueprint.category}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: progression.isUnlocked ? 'var(--md-success-bg)' : 'var(--md-warning-bg)',
                      color: progression.isUnlocked ? 'var(--md-success)' : 'var(--md-warning)',
                      padding: '2px 9px',
                      borderRadius: '9999px',
                    }}
                  >
                    {progression.isUnlocked ? 'Job Market Unlocked' : `Unlocks at ${MINIMUM_JOB_MARKET_PROGRESS_PCT}% Roadmap`}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--md-text-primary)',
                    margin: '4px 0',
                  }}
                >
                  Global Job Market · {targetRole}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: 0 }}>
                  Current job circulars around the world matched automatically to skills unlocked by your completed roadmap stages.
                </p>
              </div>

              {/* Progression Status Card */}
              <div
                style={{
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '14px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)', textTransform: 'uppercase' }}>
                    Roadmap Progress
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                    {progression.progressPct}%
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                    {progression.completedStagesCount}/{progression.totalStagesCount} stages · {progression.achievedSkills.length} skills earned
                  </div>
                </div>

                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                  <svg width="48" height="48" viewBox="0 0 36 36" aria-hidden="true">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--md-outline)"
                      strokeWidth="3.8"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={progression.isUnlocked ? '#10B981' : 'var(--md-primary)'}
                      strokeWidth="3.8"
                      strokeDasharray={`${progression.progressPct}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {!progression.isUnlocked ? (
            /* Minimum 20% Roadmap Unlock Gate */
            <section
              className="m3-surface-card"
              style={{
                padding: '32px 24px',
                display: 'grid',
                gap: '18px',
                textAlign: 'center',
                justifyItems: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--md-primary)',
                }}
              >
                <Lock size={24} />
              </div>

              <div style={{ maxWidth: '520px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                  Reach {MINIMUM_JOB_MARKET_PROGRESS_PCT}% on Your Roadmap to Unlock Global Job Circulars
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--md-text-secondary)' }}>
                  Global job circulars open once you achieve your first foundation skills by completing at least{' '}
                  <strong>{MINIMUM_JOB_MARKET_PROGRESS_PCT}%</strong> of your <strong>{targetRole}</strong> roadmap.
                  {progression.tasksNeededToUnlock > 0
                    ? ` Complete ${progression.tasksNeededToUnlock} more task${progression.tasksNeededToUnlock === 1 ? '' : 's'} to unlock.`
                    : ''}
                </p>
              </div>

              <div style={{ width: '100%', maxWidth: '420px', display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>
                  <span>Current Progression: {progression.progressPct}%</span>
                  <span>Target: {MINIMUM_JOB_MARKET_PROGRESS_PCT}% ({progression.completedTasks}/{progression.totalTasks} tasks)</span>
                </div>
                <div style={{ height: '8px', borderRadius: '9999px', background: 'var(--md-surface-variant)', border: '1px solid var(--md-outline)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((progression.progressPct / MINIMUM_JOB_MARKET_PROGRESS_PCT) * 100))}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      background: 'var(--md-primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {progression.upcomingSkills.length > 0 && (
                <div style={{ maxWidth: '540px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Skills you will unlock for job matching
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    {progression.upcomingSkills.slice(0, 8).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: 'var(--md-surface-variant)',
                          border: '1px solid var(--md-outline)',
                          color: 'var(--md-text-secondary)',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {onNavigateToRoadmap && (
                <button
                  type="button"
                  className="btn-m3-primary"
                  onClick={onNavigateToRoadmap}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px' }}
                >
                  <span>Go to Roadmap &amp; Complete Tasks</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </section>
          ) : (
            /* Unlocked 2-Column Layout: Roadmap Skills Matrix + Worldwide Job Circulars */
            <div className="jm-unlocked-grid">
              {/* LEFT COLUMN: Roadmap-Earned Skills */}
              <div className="m3-surface-card jm-skills-card">
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="var(--md-primary)" />
                    Skills Achieved from Roadmap
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                    Automatically unlocked as you finish stages on your career roadmap.
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--md-text-secondary)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Achieved ({progression.achievedSkills.length})
                  </span>
                  {progression.achievedSkills.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--md-text-muted)' }}>
                      Complete all tasks inside your first stage on the Roadmap to formally mark its stage skills as achieved!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {progression.skillItems
                        .filter((item) => item.isUnlocked)
                        .map((item) => (
                          <span
                            key={item.name}
                            title={`Unlocked at Stage ${item.stagePosition}: ${item.stageTitle}`}
                            className="jm-achieved-pill"
                          >
                            <CheckCircle2 size={12} color="#059669" style={{ flexShrink: 0 }} />
                            <span>{item.name}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {progression.upcomingSkills.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--md-text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Unlocking in Next Stages ({progression.upcomingSkills.length})
                      </span>
                      {progression.upcomingSkills.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllUpcomingSkills((prev) => !prev)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--md-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {showAllUpcomingSkills ? 'Show less' : `View all (${progression.upcomingSkills.length})`}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {progression.skillItems
                        .filter((item) => !item.isUnlocked)
                        .slice(0, showAllUpcomingSkills ? 8 : 3)
                        .map((item) => {
                          const shortStage = item.stageTitle.split('·')[0].replace(/^Phase\s+\d+:\s*/i, '').trim();
                          return (
                            <div
                              key={item.name}
                              className="jm-upcoming-row"
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <strong style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.name}
                                </strong>
                                <span style={{ fontSize: '11px', color: 'var(--md-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Stage {String(item.stagePosition).padStart(2, '0')} · {shortStage}
                                </span>
                              </div>
                              {onAddSkillToRoadmap && (
                                <button
                                  type="button"
                                  onClick={() => void handleQueueSkill(item.name)}
                                  style={{
                                    background: 'var(--md-surface)',
                                    border: '1px solid var(--md-outline)',
                                    color: 'var(--md-text-secondary)',
                                    borderRadius: '8px',
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                  }}
                                >
                                  <PlusCircle size={12} /> Queue
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {onNavigateToRoadmap && progression.progressPct < 100 && (
                  <button
                    type="button"
                    className="btn-m3-white"
                    onClick={onNavigateToRoadmap}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    Advance Roadmap Progress ({progression.progressPct}%)
                  </button>
                )}
              </div>

              {/* RIGHT COLUMN: Global Job Circulars */}
              <div className="m3-surface-card jm-circulars-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Globe size={16} color="var(--md-primary)" />
                      Global Job Circulars Around the World
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                      Ranked by your {progression.achievedSkills.length} achieved skill{progression.achievedSkills.length === 1 ? '' : 's'} · {targetRole}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      aria-pressed={filterMode === 'all'}
                      className={`m3-tab-pill ${filterMode === 'all' ? 'active' : ''}`}
                    >
                      All ({combinedCirculars.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('strong_match')}
                      aria-pressed={filterMode === 'strong_match'}
                      className={`m3-tab-pill ${filterMode === 'strong_match' ? 'active' : ''}`}
                    >
                      ≥50% Match
                    </button>
                  </div>
                </div>

                {/* Quick Global Region Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {GLOBAL_MARKET_REGIONS.map((region) => {
                    const active = liveSearchMode === region.mode && liveLocation.toLowerCase() === region.location.toLowerCase();
                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleRegionPreset(region)}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          border: `1px solid ${active ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                          background: active ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                          color: active ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Global Search Form */}
                <form
                  onSubmit={(event) => void handleSearchSubmit(event)}
                  noValidate
                  className={`job-search-form${liveSearchMode !== 'remote' ? ' has-location' : ''}`}
                >
                  <label className="job-search-field job-search-type-field">
                    <span className="sr-only">Search scope</span>
                    <select
                      aria-label="Search scope"
                      value={liveSearchMode}
                      onChange={(event) => setLiveSearchMode(event.target.value as LiveSearchMode)}
                      className="job-search-control job-search-select"
                    >
                      <option value="remote">Worldwide Remote</option>
                      <option value="regional">Country / City</option>
                      <option value="hybrid">Global Hybrid</option>
                    </select>
                  </label>
                  <label className="job-search-field job-search-role-field">
                    <span className="sr-only">Search global job circulars by role</span>
                    <Search size={15} aria-hidden="true" className="job-search-input-icon" />
                    <input
                      aria-label="Search global job circulars by role"
                      value={liveQuery}
                      onChange={(event) => {
                        setLiveQuery(event.target.value);
                        if (liveError) setLiveError('');
                      }}
                      maxLength={120}
                      placeholder="Role or skill..."
                      className="job-search-control job-search-input-with-icon"
                    />
                  </label>
                  {liveSearchMode !== 'remote' && (
                    <label className="job-search-field job-search-location-field">
                      <span className="sr-only">Country, city, or region</span>
                      <MapPin size={15} aria-hidden="true" className="job-search-input-icon" />
                      <input
                        aria-label="Country, city, or region"
                        value={liveLocation}
                        onChange={(event) => {
                          setLiveLocation(event.target.value);
                          if (liveError) setLiveError('');
                        }}
                        maxLength={100}
                        placeholder="e.g. Germany, Canada, Dhaka"
                        className="job-search-control job-search-input-with-icon"
                      />
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={liveLoading}
                    className="job-search-submit-btn"
                  >
                    {liveLoading ? <LoaderCircle size={14} className="spin-animation" aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
                    <span>{liveLoading ? 'Searching…' : 'Search'}</span>
                  </button>
                </form>

                {liveFetchedAt && (
                  <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                    Live circular feed synced {new Date(liveFetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
                  </div>
                )}
                {liveError && (
                  <p role="status" style={{ color: 'var(--md-text-secondary)', fontSize: '12px', margin: 0 }}>
                    {liveError}
                  </p>
                )}

                {/* Job Circular Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {liveLoading && <CardGridSkeleton count={3} label="Searching global job circulars" />}

                  {!liveLoading && displayedCirculars.length === 0 && (
                    <p style={{ color: 'var(--md-text-secondary)', fontSize: '12.5px', margin: 0 }}>
                      No circulars matched this strict filter yet — try switching to &ldquo;All&rdquo; or advancing another stage on your Roadmap.
                    </p>
                  )}

                  {!liveLoading &&
                    displayedCirculars.map((vac) => (
                      <div
                        key={vac.id}
                        style={{
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          display: 'grid',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--md-text-primary)', margin: '0 0 2px' }}>
                              {vac.source_url ? (
                                <a
                                  href={vac.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'inherit', textDecoration: 'none' }}
                                >
                                  {vac.title} <ExternalLink size={12} aria-hidden="true" style={{ verticalAlign: 'middle' }} />
                                </a>
                              ) : (
                                vac.title
                              )}
                            </h4>
                            <div style={{ fontSize: '12.5px', color: 'var(--md-primary)', fontWeight: 600 }}>
                              {vac.company}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--md-text-muted)', marginTop: '2px' }}>
                              {vac.source_type === 'remoteok'
                                ? 'Live Circular · Remote OK'
                                : vac.source_type === 'jooble'
                                  ? 'Live Circular · Jooble'
                                  : 'Global Circular Search Portal'}
                              {vac.published_at && ` · ${new Date(vac.published_at).toLocaleDateString()}`}
                            </div>
                          </div>

                          <div
                            style={{
                              background:
                                vac.match_pct !== null && vac.match_pct >= 50
                                  ? 'var(--md-success-bg)'
                                  : 'var(--md-surface-variant)',
                              color:
                                vac.match_pct !== null && vac.match_pct >= 50
                                  ? 'var(--md-success)'
                                  : 'var(--md-text-secondary)',
                              border: '1px solid var(--md-outline)',
                              padding: '3px 9px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {vac.match_pct === null ? 'Role Match' : `${vac.match_pct}% skill match`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--md-text-secondary)', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {vac.location}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={12} /> {vac.salary_range}
                          </span>
                        </div>

                        {vac.required_skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {vac.required_skills.map((skill) => {
                              const isAchieved = !vac.missing_skills.includes(skill);
                              return (
                                <span
                                  key={skill}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: isAchieved ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                                    color: isAchieved ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                                    border: '1px solid var(--md-outline)',
                                  }}
                                >
                                  {isAchieved ? '✓ ' : ''}{skill}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
