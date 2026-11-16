import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Search,
  TrendingUp,
  MapPin,
  DollarSign,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import type { Skill, Vacancy } from '../types';
import { supabase } from '../lib/supabase';
import { createCustomCareerBlueprint, findCuratedCareerBlueprint } from '../features/roadmap/careerCatalog';
import type { CareerCategory } from '../features/roadmap/careerCatalog';
import { LearningResourcesPanel } from '../features/resources/LearningResourcesPanel';
import { CardGridSkeleton, ListSkeleton } from './SkeletonScreen';

interface Props {
  userId: string;
  targetRole: string;
  targetRoleCategory?: CareerCategory;
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

function localSkillsStorageKey(userId: string): string {
  return `career_pilot_local_skills_${userId}`;
}

function loadLocalAcquiredSkills(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(localSkillsStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((item): item is string => typeof item === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalAcquiredSkills(userId: string, namesOrIds: Set<string>): void {
  try {
    localStorage.setItem(localSkillsStorageKey(userId), JSON.stringify([...namesOrIds]));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

function buildFallbackSkillsFromBlueprint(
  role: ReturnType<typeof createCustomCareerBlueprint>,
  acquiredKeys: Set<string>,
): Skill[] {
  const orderedNames = [...new Set([...role.skills, ...role.stages.flatMap((stage) => stage.skills)])]
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 14);
  return orderedNames.map((name, idx) => {
    const id = `curated_${role.slug}_${idx}`;
    return {
      id,
      name,
      category: role.category,
      is_acquired: acquiredKeys.has(id) || acquiredKeys.has(name.toLowerCase()),
    };
  });
}

function buildFallbackRoleVacancies(roleTitle: string, skillsList: Skill[]): Vacancy[] {
  const names = skillsList.map((s) => s.name);
  const acquiredSet = new Set(skillsList.filter((s) => s.is_acquired).map((s) => s.name));
  const specs = [
    {
      id: 'benchmark-mid',
      title: roleTitle,
      company: 'Cloud-Native Product Teams',
      location: 'Remote · Full-Time',
      salary_range: 'Market Benchmark · Mid-Level',
      slice: names.slice(0, Math.min(6, names.length)),
    },
    {
      id: 'benchmark-senior',
      title: `Senior ${roleTitle}`,
      company: 'Distributed Platform Engineering',
      location: 'Remote / Hybrid',
      salary_range: 'Market Benchmark · Senior',
      slice: names.slice(Math.max(0, Math.min(3, names.length - 5)), Math.min(9, names.length)),
    },
    {
      id: 'benchmark-associate',
      title: `Associate ${roleTitle}`,
      company: 'Growth-Stage Engineering Org',
      location: 'Remote Friendly',
      salary_range: 'Market Benchmark · Entry / Junior',
      slice: names.slice(0, Math.min(4, names.length)),
    },
  ];
  return specs
    .filter((spec) => spec.slice.length > 0)
    .map((spec) => {
      const missing = spec.slice.filter((skill) => !acquiredSet.has(skill));
      return {
        id: spec.id,
        title: spec.title,
        company: spec.company,
        location: spec.location,
        salary_range: spec.salary_range,
        match_pct: Math.round(((spec.slice.length - missing.length) / spec.slice.length) * 100),
        required_skills: spec.slice,
        missing_skills: missing,
        source_type: 'sample' as const,
      };
    });
}

function recomputeVacancyMatches(list: Vacancy[], updatedSkills: Skill[]): Vacancy[] {
  const acquiredNames = new Set(
    updatedSkills.filter((skill) => skill.is_acquired).map((skill) => skill.name.toLowerCase())
  );
  return list.map((vacancy) => {
    if (vacancy.required_skills.length === 0) return vacancy;
    const missing = vacancy.required_skills.filter((req) => !acquiredNames.has(req.toLowerCase()));
    return {
      ...vacancy,
      missing_skills: missing,
      match_pct: Math.round(
        ((vacancy.required_skills.length - missing.length) / vacancy.required_skills.length) * 100
      ),
    };
  });
}

async function findRemoteJobs(
  query: string,
  category: CareerCategory,
  requirements: Skill[],
  mode: LiveSearchMode = 'remote',
  location = '',
): Promise<{ response: RemoteJobsResponse; vacancies: Vacancy[] }> {
  const result = await supabase.functions.invoke('search-remote-jobs', {
    body: { query, category, skills: requirements.map((skill) => skill.name).slice(0, 20), mode, location },
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
    throw new Error(result.error.message || 'Remote search failed.');
  }
  if (!result.data || typeof result.data !== 'object') throw new Error('The remote job source returned an invalid response.');
  const payload = result.data as Partial<RemoteJobsResponse> & { error?: string };
  if (payload.error) throw new Error(payload.error);
  if (!Array.isArray(payload.jobs) || typeof payload.fetched_at !== 'string' || typeof payload.source !== 'string') throw new Error('The live job source returned incomplete data.');
  const sourceName = payload.source || 'Remote OK';

  const vacancies = payload.jobs.map((job) => {
    const searchable = `${job.title} ${job.tags.join(' ')} ${job.description}`;
    const required = requirements.filter((skill) => skillIsMentioned(searchable, skill.name));
    const acquired = required.filter((skill) => skill.is_acquired);
    const missing = required.filter((skill) => !skill.is_acquired);
    return {
      id: `${sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${job.id}`,
      title: job.title,
      company: job.company,
      location: job.location || 'Remote (eligibility varies)',
      salary_range: job.salary_range || 'Salary not provided',
      match_pct: required.length ? Math.round((acquired.length / required.length) * 100) : null,
      required_skills: required.map((skill) => skill.name),
      missing_skills: missing.map((skill) => skill.name),
      source_type: sourceName === 'Jooble' ? 'jooble' as const : 'remoteok' as const,
      source_url: job.source_url,
      published_at: job.published_at,
    };
  });
  return { response: payload as RemoteJobsResponse, vacancies };
}

export const SkillGapView: React.FC<Props> = ({
  userId,
  targetRole,
  targetRoleCategory,
  onAddSkillToRoadmap,
  onAddResourceToRoadmap,
  onToast,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'skills' | 'resources'>('skills');
  const [filterMode, setFilterMode] = useState<'all' | 'high_match'>('all');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [liveVacancies, setLiveVacancies] = useState<Vacancy[]>([]);
  const [liveQuery, setLiveQuery] = useState(targetRole);
  const [liveSearchMode, setLiveSearchMode] = useState<LiveSearchMode>('remote');
  const [liveLocation, setLiveLocation] = useState('');
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState('');
  const [liveFetchedAt, setLiveFetchedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [usesCategoryBaseline, setUsesCategoryBaseline] = useState(false);
  const [resolvedRoleCategory, setResolvedRoleCategory] = useState<CareerCategory | undefined>(targetRoleCategory);
  const liveSearchRequest = useRef(0);

  useEffect(() => {
    let active = true;
    if (workspaceTab !== 'skills') {
      liveSearchRequest.current += 1;
      return () => { active = false; };
    }
    const requestId = ++liveSearchRequest.current;
    const curatedRole = findCuratedCareerBlueprint(targetRole);
    const role = curatedRole || createCustomCareerBlueprint(targetRole, targetRoleCategory);
    const categoryBaseline = !curatedRole;
    const load = async () => {
      setLoading(true);
      setError('');
      setLiveLoading(true);
      setLiveError('');
      setLiveVacancies([]);
      setLiveFetchedAt('');
      setUsesCategoryBaseline(categoryBaseline);
      setResolvedRoleCategory(role.category);
      setSkills([]);
      setVacancies([]);
      const requirementsRequest = categoryBaseline
        ? supabase
          .from('career_category_skill_requirements')
          .select('importance,skills(id,name,category)')
          .eq('career_category', role.category)
          .order('importance', { ascending: false })
        : supabase
          .from('role_skill_requirements')
          .select('importance,skills(id,name,category)')
          .eq('role_slug', role.slug)
          .order('importance', { ascending: false });
      const [requirementsResult, userSkillsResult, vacanciesResult] = await Promise.all([
        requirementsRequest,
        supabase.from('user_skills').select('skill_id').eq('user_id', userId),
        supabase
          .from('vacancies')
          .select('id,title,company,location,salary_range,vacancy_skills(skill_id,skills(id,name))')
          .eq('role_slug', role.slug)
          .order('created_at', { ascending: false }),
      ]);
      if (!active || requestId !== liveSearchRequest.current) return;

      const localAcquired = loadLocalAcquiredSkills(userId);
      const dbAcquired = userSkillsResult.error
        ? new Set<string>()
        : new Set((userSkillsResult.data ?? []).map((row: any) => String(row.skill_id)));

      let loadedSkills: Skill[] = [];
      if (!requirementsResult.error) {
        loadedSkills = (requirementsResult.data ?? []).flatMap((row: any) => {
          const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
          return skill ? [{
            id: skill.id,
            name: skill.name,
            category: skill.category,
            is_acquired: dbAcquired.has(skill.id) || localAcquired.has(skill.id) || localAcquired.has(skill.name.toLowerCase()),
          }] : [];
        }) as Skill[];
      }

      if (loadedSkills.length === 0) {
        loadedSkills = buildFallbackSkillsFromBlueprint(role, localAcquired);
      }

      const loadedVacancies = !vacanciesResult.error
        ? (vacanciesResult.data ?? []).map((row: any) => {
            const requirements = (row.vacancy_skills ?? []).filter((entry: any) => entry.skills?.name);
            const required = requirements.map((entry: any) => entry.skills.name) as string[];
            const missing = requirements
              .filter((entry: any) => !dbAcquired.has(entry.skill_id) && !localAcquired.has(entry.skills.name.toLowerCase()))
              .map((entry: any) => entry.skills.name) as string[];
            return {
              id: row.id,
              title: row.title,
              company: row.company,
              location: row.location,
              salary_range: row.salary_range ?? 'Salary not provided',
              match_pct: required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : null,
              required_skills: required,
              missing_skills: missing,
              source_type: 'sample' as const,
            } as Vacancy;
          })
        : [];

      setSkills(loadedSkills);
      setVacancies(loadedVacancies.length > 0 ? loadedVacancies : buildFallbackRoleVacancies(role.title, loadedSkills));
      setLoading(false);
      setLiveQuery(targetRole);
      setLiveLoading(true);
      setLiveError('');
      try {
        const remote = await findRemoteJobs(targetRole, role.category, loadedSkills);
        if (!active || requestId !== liveSearchRequest.current) return;
        setLiveVacancies(remote.vacancies);
        setLiveFetchedAt(remote.response.fetched_at);
      } catch {
        if (!active || requestId !== liveSearchRequest.current) return;
        setLiveVacancies([]);
        setLiveError('Live remote search is offline — showing role benchmark expectations below.');
      } finally {
        if (active && requestId === liveSearchRequest.current) setLiveLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [userId, targetRole, targetRoleCategory, workspaceTab]);

  const acquiredCount = skills.filter((s) => s.is_acquired).length;
  const totalTargetCount = skills.length;
  const hasPublishedRequirements = totalTargetCount > 0;
  const readinessPct = totalTargetCount ? Math.round((acquiredCount / totalTargetCount) * 100) : 0;

  const allVacancies = useMemo(() => [...liveVacancies, ...vacancies], [liveVacancies, vacancies]);
  const displayedVacancies = useMemo(() =>
    filterMode === 'high_match'
      ? allVacancies.filter((v) => v.match_pct !== null && v.match_pct >= 75)
      : allVacancies, [allVacancies, filterMode]);

  const executeLiveSearch = async (
    mode: LiveSearchMode,
    queryText: string,
    locationText: string,
    skillsSnapshot: Skill[]
  ) => {
    const cleanQuery = queryText.trim();
    const cleanLocation = locationText.trim();
    if (cleanQuery.length < 2) {
      setLiveError('Enter at least 2 characters for the role title.');
      return;
    }
    if (mode !== 'remote' && cleanLocation.length < 2) {
      setLiveError('Enter a city, region, or country (at least 2 characters) to search.');
      return;
    }

    const requestId = ++liveSearchRequest.current;
    setLiveLoading(true);
    setLiveError('');
    try {
      const remote = await findRemoteJobs(
        cleanQuery,
        resolvedRoleCategory || 'Software & Web',
        skillsSnapshot,
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
        remoteError instanceof Error ? remoteError.message : 'Live job search is temporarily unavailable.'
      );
    } finally {
      if (requestId === liveSearchRequest.current) setLiveLoading(false);
    }
  };

  const searchRemoteListings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (liveLoading) return;
    await executeLiveSearch(liveSearchMode, liveQuery, liveLocation, skills);
  };

  const handleSearchModeChange = (nextMode: LiveSearchMode) => {
    liveSearchRequest.current += 1;
    setLiveSearchMode(nextMode);
    setLiveVacancies([]);
    setLiveFetchedAt('');
    setLiveError('');
    setLiveLoading(false);

    if (nextMode === 'remote' && liveQuery.trim().length >= 2) {
      void executeLiveSearch('remote', liveQuery, '', skills);
    } else if (nextMode !== 'remote' && liveQuery.trim().length >= 2 && liveLocation.trim().length >= 2) {
      void executeLiveSearch(nextMode, liveQuery, liveLocation, skills);
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

  const toggleSkill = async (skill: Skill) => {
    if (savingSkill) return;
    setSavingSkill(skill.id);
    setError('');
    try {
      const nextAcquired = !skill.is_acquired;
      const localSet = loadLocalAcquiredSkills(userId);
      if (nextAcquired) {
        localSet.add(skill.id);
        localSet.add(skill.name.toLowerCase());
      } else {
        localSet.delete(skill.id);
        localSet.delete(skill.name.toLowerCase());
      }
      saveLocalAcquiredSkills(userId, localSet);

      if (!skill.id.startsWith('curated_')) {
        const result = skill.is_acquired
          ? await supabase.from('user_skills').delete().eq('user_id', userId).eq('skill_id', skill.id)
          : await supabase.from('user_skills').upsert({ user_id: userId, skill_id: skill.id, level: 'proficient' }, { onConflict: 'user_id,skill_id' });
        if (result.error && !/schema cache|does not exist|relation/i.test(result.error.message)) {
          setError(result.error.message);
          return;
        }
      }

      const nextSkills = skills.map((item) => (item.id === skill.id ? { ...item, is_acquired: nextAcquired } : item));
      setSkills(nextSkills);
      // Keep benchmark and live job vacancy match percentages synced live when skills change
      setVacancies((prev) => recomputeVacancyMatches(prev, nextSkills));
      setLiveVacancies((prev) => recomputeVacancyMatches(prev, nextSkills));
    } catch (skillError) {
      setError(skillError instanceof Error ? skillError.message : 'Could not update your saved skill.');
    } finally {
      setSavingSkill(null);
    }
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '40px' }}>
      <div role="group" aria-label="Career skills workspace" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--md-outline)', paddingBottom: '12px' }}>
        <button
          type="button"
          aria-pressed={workspaceTab === 'skills'}
          onClick={() => setWorkspaceTab('skills')}
          className={`m3-tab-pill ${workspaceTab === 'skills' ? 'active' : ''}`}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <TrendingUp size={15} aria-hidden="true" /> Skills &amp; jobs
        </button>
        <button
          type="button"
          aria-pressed={workspaceTab === 'resources'}
          onClick={() => setWorkspaceTab('resources')}
          className={`m3-tab-pill ${workspaceTab === 'resources' ? 'active' : ''}`}
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <BookOpen size={15} aria-hidden="true" /> Learning resources
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
      {/* Header Summary */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--md-primary-container)',
                  color: 'var(--md-on-primary-container)',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                }}
              >
                {usesCategoryBaseline ? 'Category baseline' : 'Role profile'}
              </span>
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                margin: '4px 0',
              }}
            >
              Skills &amp; Market Fit
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: 0 }}>
              {usesCategoryBaseline
                ? `Category baseline for ${resolvedRoleCategory || 'career'} roles.`
                : 'Compare your acquired skills with role requirements and live roles.'}
            </p>
          </div>

          {/* Quiet Readiness Card */}
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
                {targetRole}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                {hasPublishedRequirements ? `${readinessPct}%` : '—'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                {hasPublishedRequirements
                  ? `${acquiredCount} / ${totalTargetCount} skills`
                  : 'No skill profile'}
              </div>
            </div>

            {hasPublishedRequirements && <div style={{ position: 'relative', width: '48px', height: '48px' }}>
              <svg width="48" height="48" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--md-outline)"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--md-primary)"
                  strokeWidth="3.8"
                  strokeDasharray={`${readinessPct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>}
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px',
        }}
      >
        {/* LEFT COLUMN: Skill Matrix */}
        <div className="m3-surface-card" style={{ padding: '20px 24px' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--md-text-primary)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={16} color="var(--md-primary)" />
            Required Skills
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', margin: '0 0 18px 0' }}>
            Mark skills you have or queue gaps into your roadmap.
          </p>

          {loading && <ListSkeleton rows={4} compact label="Loading required skills" />}
          {!loading && !error && skills.length === 0 && (
            <p role="status" style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
              {usesCategoryBaseline
                ? `No category baseline published for ${resolvedRoleCategory || 'this career'} yet.`
                : 'No role skill requirements published yet.'}
            </p>
          )}

          {/* Acquired Skills */}
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--md-success)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Acquired ({acquiredCount})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills
                .filter((s) => s.is_acquired)
                .map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => void toggleSkill(skill)}
                    disabled={savingSkill === skill.id}
                    title="Click to unmark"
                    style={{
                      background: 'var(--md-success-bg)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: 'var(--md-success)',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {skill.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Missing Skills */}
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--md-text-secondary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Gaps ({totalTargetCount - acquiredCount})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {skills
                .filter((s) => !s.is_acquired)
                .map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-text-primary)', display: 'block' }}>
                        {skill.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                        {skill.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => void toggleSkill(skill)}
                        disabled={savingSkill === skill.id}
                        style={{
                          background: 'var(--md-surface)',
                          border: '1px solid var(--md-outline)',
                          color: 'var(--md-text-secondary)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {savingSkill === skill.id ? 'Saving…' : 'Acquired'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleQueueSkill(skill.name)}
                        style={{
                          background: 'var(--md-primary-container)',
                          border: '1px solid transparent',
                          color: 'var(--md-on-primary-container)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <PlusCircle size={13} />
                        Queue
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Job Listings */}
        <div className="m3-surface-card" style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--md-text-primary)', margin: 0 }}>
                Job Listings
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                Skill overlap signal
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                aria-pressed={filterMode === 'all'}
                className={`m3-tab-pill ${filterMode === 'all' ? 'active' : ''}`}
              >
                All ({allVacancies.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('high_match')}
                aria-pressed={filterMode === 'high_match'}
                className={`m3-tab-pill ${filterMode === 'high_match' ? 'active' : ''}`}
              >
                ≥75% match
              </button>
            </div>
          </div>
          <form
            onSubmit={(event) => void searchRemoteListings(event)}
            noValidate
            className={`job-search-form${liveSearchMode !== 'remote' ? ' has-location' : ''}`}
          >
            <label className="job-search-field job-search-type-field">
              <span className="sr-only">Search type</span>
              <select
                aria-label="Search type"
                value={liveSearchMode}
                onChange={(event) => handleSearchModeChange(event.target.value as LiveSearchMode)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '40px',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '8px',
                  background: 'var(--md-surface)',
                  color: 'var(--md-text-primary)',
                  padding: '0 10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <option value="remote">Remote</option>
                <option value="regional">Regional</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="job-search-field job-search-role-field" style={{ position: 'relative' }}>
              <Search size={15} aria-hidden="true" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-text-muted)', pointerEvents: 'none' }} />
              <input
                aria-label="Search live jobs by role"
                value={liveQuery}
                onChange={(event) => {
                  setLiveQuery(event.target.value);
                  if (liveError) setLiveError('');
                }}
                maxLength={120}
                placeholder="Search role..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '40px',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '8px',
                  background: 'var(--md-surface)',
                  color: 'var(--md-text-primary)',
                  padding: '0 12px 0 34px',
                  fontSize: '13px',
                }}
              />
            </label>
            {liveSearchMode !== 'remote' && (
              <label className="job-search-field job-search-location-field">
                <span className="sr-only">City, region, or country</span>
                <input
                  aria-label="City, region, or country"
                  value={liveLocation}
                  onChange={(event) => {
                    setLiveLocation(event.target.value);
                    if (liveError) setLiveError('');
                  }}
                  maxLength={100}
                  placeholder="City, region, or country"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: '40px',
                    border: '1px solid var(--md-outline)',
                    borderRadius: '8px',
                    background: 'var(--md-surface)',
                    color: 'var(--md-text-primary)',
                    padding: '0 12px',
                    fontSize: '13px',
                  }}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={liveLoading}
              className="job-search-submit-btn"
            >
              {liveLoading ? <LoaderCircle size={14} className="spin-animation" aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
              {liveLoading ? 'Searching' : 'Search'}
            </button>
          </form>
          <p style={{ fontSize: '11px', color: 'var(--md-text-muted)', margin: '0 0 14px' }}>
            {liveSearchMode === 'remote'
              ? <>Live listings via <a href="https://remoteok.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>Remote OK</a>.</>
              : liveLocation.trim().length < 2 && liveVacancies.length === 0 && !liveLoading && !liveError
                ? <>Enter a city, region, or country and select <strong>Search</strong> for regional listings via <a href="https://jooble.org/api/about" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>Jooble</a>.</>
                : <>Regional listings via <a href="https://jooble.org/api/about" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>Jooble</a>.</>}
            {liveFetchedAt && <span> Updated {new Date(liveFetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.</span>}
          </p>

          {/* Vacancies List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(loading || liveLoading) && <CardGridSkeleton count={3} label="Loading matching roles and vacancies" />}
            {!loading && error && <p role="alert" style={{ color: 'var(--md-error)', fontSize: '13px' }}>{error}</p>}
            {!loading && liveError && <p role="status" style={{ color: 'var(--md-text-secondary)', fontSize: '12.5px', margin: 0 }}>{liveError}</p>}
            {!loading && !liveLoading && !liveError && allVacancies.length === 0 && <p style={{ color: 'var(--md-text-secondary)', fontSize: '12.5px' }}>No listings matched. Try a broader term.</p>}
            {!loading && !liveLoading && allVacancies.length > 0 && displayedVacancies.length === 0 && <p style={{ color: 'var(--md-text-secondary)', fontSize: '12.5px' }}>No listings meet this filter.</p>}
            {displayedVacancies.map((vac) => {
              return (
                <div
                  key={vac.id}
                  style={{
                    border: '1px solid var(--md-outline)',
                    background: 'var(--md-surface)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--md-text-primary)',
                          margin: '0 0 2px 0',
                        }}
                      >
                        {vac.source_url ? (
                          <a href={vac.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {vac.title}<ExternalLink size={12} aria-hidden="true" style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                          </a>
                        ) : vac.title}
                      </h4>
                      <div style={{ fontSize: '12.5px', color: 'var(--md-primary)', fontWeight: 600 }}>
                        {vac.company}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--md-text-muted)', marginTop: '2px' }}>
                        {vac.source_type === 'remoteok' ? 'Remote OK' : vac.source_type === 'jooble' ? 'Jooble' : 'Role Benchmark'}
                        {vac.published_at && ` · ${new Date(vac.published_at).toLocaleDateString()}`}
                      </div>
                    </div>

                    {/* Match Badge */}
                    <div
                      style={{
                        background:
                          vac.match_pct !== null && vac.match_pct >= 75
                            ? 'var(--md-success-bg)'
                            : 'var(--md-surface-variant)',
                        color:
                          vac.match_pct !== null && vac.match_pct >= 75
                            ? 'var(--md-success)'
                            : 'var(--md-text-secondary)',
                        border: '1px solid var(--md-outline)',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vac.match_pct === null ? 'No tag match' : `${vac.match_pct}% skills`}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontSize: '12px',
                      color: 'var(--md-text-secondary)',
                      marginBottom: vac.required_skills.length ? '10px' : 0,
                      flexWrap: 'wrap',
                    }}
                  >
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
                        const isAcquired = !vac.missing_skills.includes(skill);
                        return (
                          <span
                            key={skill}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isAcquired ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                              color: isAcquired ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                              border: '1px solid var(--md-outline)',
                            }}
                          >
                            {isAcquired ? '✓ ' : ''}{skill}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
