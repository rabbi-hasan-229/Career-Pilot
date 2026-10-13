import React, { useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  MapPin,
  DollarSign,
  PlusCircle,
} from 'lucide-react';
import type { Skill, Vacancy } from '../types';

interface Props {
  targetRole: string;
  onAddSkillToRoadmap?: (skillName: string) => void;
  onToast: (msg: string) => void;
}

const mockTargetSkills: Skill[] = [
  { id: 'sk-1', name: 'PostgreSQL', category: 'Database', is_acquired: true },
  { id: 'sk-2', name: 'TypeScript', category: 'Language', is_acquired: true },
  { id: 'sk-3', name: 'React', category: 'Frontend', is_acquired: true },
  { id: 'sk-4', name: 'REST APIs', category: 'Backend', is_acquired: true },
  { id: 'sk-5', name: 'Data Structures', category: 'Computer Science', is_acquired: true },
  { id: 'sk-6', name: 'Git & Version Control', category: 'Tools', is_acquired: true },
  { id: 'sk-7', name: 'Docker & Containers', category: 'DevOps', is_acquired: false },
  { id: 'sk-8', name: 'Redis Caching', category: 'Database', is_acquired: false },
  { id: 'sk-9', name: 'System Design', category: 'Architecture', is_acquired: false },
  { id: 'sk-10', name: 'GraphQL', category: 'Backend', is_acquired: false },
];

const mockVacancies: Vacancy[] = [
  {
    id: 'vac-1',
    title: 'Full Stack Engineer (TypeScript / Postgres)',
    company: 'Apex Cloud Systems',
    location: 'Remote · Dhaka / Global',
    salary_range: '$65k - $85k / yr',
    match_pct: 80,
    required_skills: ['TypeScript', 'React', 'PostgreSQL', 'Docker & Containers', 'REST APIs'],
    missing_skills: ['Docker & Containers'],
  },
  {
    id: 'vac-2',
    title: 'Junior Backend Developer',
    company: 'Nexlify Labs',
    location: 'Dhaka, Bangladesh',
    salary_range: 'BDT 50k - 70k / mo',
    match_pct: 85,
    required_skills: ['PostgreSQL', 'TypeScript', 'REST APIs', 'Data Structures', 'Redis Caching'],
    missing_skills: ['Redis Caching'],
  },
  {
    id: 'vac-3',
    title: 'Platform Software Engineer',
    company: 'FinScale Technologies',
    location: 'Hybrid · Gulshan, Dhaka',
    salary_range: '$70k - $95k / yr',
    match_pct: 60,
    required_skills: ['PostgreSQL', 'Docker & Containers', 'System Design', 'Redis Caching', 'TypeScript'],
    missing_skills: ['Docker & Containers', 'System Design', 'Redis Caching'],
  },
  {
    id: 'vac-4',
    title: 'React & Frontend Specialist',
    company: 'DesignCraft Global',
    location: 'Remote',
    salary_range: '$55k - $75k / yr',
    match_pct: 90,
    required_skills: ['React', 'TypeScript', 'REST APIs', 'Git & Version Control'],
    missing_skills: [],
  },
];

export const SkillGapView: React.FC<Props> = ({
  targetRole,
  onAddSkillToRoadmap,
  onToast,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'high_match'>('all');
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(mockVacancies[0]);

  const acquiredCount = mockTargetSkills.filter((s) => s.is_acquired).length;
  const totalTargetCount = mockTargetSkills.length;
  const readinessPct = Math.round((acquiredCount / totalTargetCount) * 100);

  const displayedVacancies =
    filterMode === 'high_match'
      ? mockVacancies.filter((v) => v.match_pct >= 75)
      : mockVacancies;

  const handleQueueSkill = (skill: string) => {
    onAddSkillToRoadmap?.(skill);
    onToast(`🎯 "${skill}" queued into your next roadmap milestone!`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Banner / Hero Summary */}
      <div className="m3-surface-card" style={{ marginBottom: '24px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#6366f1',
                  textTransform: 'uppercase',
                }}
              >
                SQL-Powered Job Matching · Docx Section 8
              </span>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                $0 AI Cost · Deterministic SQL
              </span>
            </div>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--md-text-primary)',
                margin: '4px 0',
              }}
            >
              Skill-Gap Matrix & Job Match Arena
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: 0 }}>
              Calculates skill overlaps against live vacancies directly in PostgreSQL without calling an LLM.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                Role Readiness ({targetRole})
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                {readinessPct}%
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                {acquiredCount} of {totalTargetCount} skills mastered
              </div>
            </div>

            {/* Circular Ring Gauge */}
            <div style={{ position: 'relative', width: '54px', height: '54px' }}>
              <svg width="54" height="54" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--md-outline)"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.8"
                  strokeDasharray={`${readinessPct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Left is Target Role Skill Matrix, Right is Vacancies matching */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* LEFT COLUMN: Skill Gap Matrix */}
        <div className="m3-surface-card">
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--md-text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={18} color="#6366f1" />
            Target Competency Breakdown
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginBottom: '16px' }}>
            Skills automatically marked verified upon completing milestone quiz checkpoints.
          </p>

          {/* Acquired Skills */}
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#10b981',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              ✓ Acquired Skills ({acquiredCount})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mockTargetSkills
                .filter((s) => s.is_acquired)
                .map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#10b981',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {skill.name}
                  </div>
                ))}
            </div>
          </div>

          {/* Missing / High-Priority Next Skills */}
          <div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#f59e0b',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              ⚡ High-Impact Missing Skills ({totalTargetCount - acquiredCount})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mockTargetSkills
                .filter((s) => !s.is_acquired)
                .map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--md-text-primary)' }}>
                        {skill.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                        Category: {skill.category}
                      </div>
                    </div>

                    <button
                      onClick={() => handleQueueSkill(skill.name)}
                      style={{
                        background: 'var(--md-surface)',
                        border: '1px solid var(--md-outline)',
                        color: '#f59e0b',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PlusCircle size={13} />
                      Queue into Plan
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Matching Vacancies in SQL */}
        <div className="m3-surface-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
                Matched Vacancies
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                Sorted by SQL match percentage
              </span>
            </div>

            {/* Filter Pill */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilterMode('all')}
                style={{
                  background: filterMode === 'all' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: filterMode === 'all' ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                All ({mockVacancies.length})
              </button>
              <button
                onClick={() => setFilterMode('high_match')}
                style={{
                  background: filterMode === 'high_match' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: filterMode === 'high_match' ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Match ≥ 75%
              </button>
            </div>
          </div>

          {/* Vacancies List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedVacancies.map((vac) => {
              const isSelected = selectedVacancy?.id === vac.id;
              return (
                <div
                  key={vac.id}
                  onClick={() => setSelectedVacancy(vac)}
                  style={{
                    border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--md-outline)'}`,
                    background: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface)',
                    borderRadius: '14px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--md-text-primary)',
                          margin: '0 0 2px 0',
                        }}
                      >
                        {vac.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>
                        {vac.company}
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      style={{
                        background:
                          vac.match_pct >= 80
                            ? 'rgba(16, 185, 129, 0.2)'
                            : vac.match_pct >= 60
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        color:
                          vac.match_pct >= 80
                            ? '#10b981'
                            : vac.match_pct >= 60
                            ? '#f59e0b'
                            : '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vac.match_pct}% Match
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '11.5px',
                      color: 'var(--md-text-secondary)',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} /> {vac.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <DollarSign size={12} /> {vac.salary_range}
                    </span>
                  </div>

                  {/* Skills tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {vac.required_skills.map((skill) => {
                      const isAcquired = !vac.missing_skills.includes(skill);
                      return (
                        <span
                          key={skill}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isAcquired ? 'var(--md-surface-variant)' : 'rgba(245, 158, 11, 0.15)',
                            color: isAcquired ? 'var(--md-text-secondary)' : '#f59e0b',
                            border: `1px solid ${isAcquired ? 'var(--md-outline)' : 'rgba(245, 158, 11, 0.35)'}`,
                          }}
                        >
                          {isAcquired ? '✓ ' : '⚡ '}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
