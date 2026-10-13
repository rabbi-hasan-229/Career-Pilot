import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Briefcase,
  GraduationCap,
  Code2,
} from 'lucide-react';
import type { CVData } from '../types';

interface Props {
  aiPromptsLeft: number;
  onUseAICall?: () => void;
  onToast: (msg: string) => void;
}

const initialCV: CVData = {
  full_name: 'Abdullah Al Mamun',
  email: 'mamun.dev@example.com',
  phone: '+880 1712-345678',
  headline: 'Aspiring Full Stack Engineer & Software Architect',
  summary:
    'Dedicated computer engineering student specializing in scalable PostgreSQL databases, React micro-frontends, and deterministic backend architecture. Strong problem-solving foundations with 80+ DSA problems solved and hands-on experience in cloud microservices.',
  skills: [
    'PostgreSQL',
    'TypeScript',
    'React',
    'Node.js',
    'SQL Optimization',
    'Supabase',
    'Data Structures',
    'Docker',
    'REST APIs',
  ],
  experience: [
    {
      title: 'Software Engineering Trainee',
      company: 'TechCraft Solutions',
      period: 'Jan 2026 - Present',
      highlights: [
        'Optimized Postgres query performance across 12 high-traffic tables using partial B-Tree indexes, reducing p95 latency by 45%.',
        'Built responsive Material 3 user interfaces using React and Tailwind/Vanilla CSS tokens, supporting 10k+ daily active users.',
        'Collaborated on zero-downtime database migrations using Supabase CLI and Row Level Security policies.',
      ],
    },
  ],
  education: [
    {
      degree: 'B.Sc. in Computer Science & Engineering',
      institution: 'Southeast University',
      year: '2023 - 2027',
    },
  ],
};

export const CVBuilderView: React.FC<Props> = ({
  aiPromptsLeft,
  onUseAICall,
  onToast,
}) => {
  const [cvData, setCvData] = useState<CVData>(initialCV);
  const [activeStep, setActiveStep] = useState<
    'personal' | 'experience' | 'education' | 'skills' | 'preview'
  >('personal');
  const [isImprovingSection, setIsImprovingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview' | 'split'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'split' : 'editor'
  );

  // Metered "Improve Wording" AI Functionality (Docx Section 8 & 9)
  const handleImproveSummary = () => {
    if (aiPromptsLeft <= 0) {
      onToast('⚠️ Weekly AI quota reached. Upgrade or wait for next reset.');
      return;
    }

    setIsImprovingSection('summary');
    onUseAICall?.();

    setTimeout(() => {
      setCvData((prev) => ({
        ...prev,
        summary:
          'High-performing Computer Engineering specialist with proven expertise in PostgreSQL performance optimization, robust TypeScript full-stack systems, and resilient cloud architectures. Delivered 45% latency improvements across production database tables with strict adherence to clean architecture principles.',
      }));
      setIsImprovingSection(null);
      onToast('✨ Professional wording applied! Metered 1 AI call.');
    }, 800);
  };

  const handleImproveBullet = (expIndex: number, bulletIndex: number) => {
    if (aiPromptsLeft <= 0) {
      onToast('⚠️ Weekly AI quota reached.');
      return;
    }

    setIsImprovingSection(`bullet_${expIndex}_${bulletIndex}`);
    onUseAICall?.();

    setTimeout(() => {
      setCvData((prev) => {
        const nextExp = [...prev.experience];
        const oldText = nextExp[expIndex].highlights[bulletIndex];
        nextExp[expIndex].highlights[bulletIndex] = `Spearheaded ${oldText.toLowerCase()} Resulted in quantified metric uplift and elevated system reliability.`;
        return { ...prev, experience: nextExp };
      });
      setIsImprovingSection(null);
      onToast('✨ Achievement impact highlighted! Metered 1 AI call.');
    }, 800);
  };

  const handleAddSkill = (skill: string) => {
    if (!skill.trim() || cvData.skills.includes(skill.trim())) return;
    setCvData((prev) => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCvData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Card */}
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
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
                Local Form Wizard · Docx Section 8
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
                Zero-Cost Editor
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
              Professional CV & Resume Builder
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: 0 }}>
              Form wizard structures your resume locally. AI wording polish is strictly opt-in and metered.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* View Switcher for smaller screens */}
            <div
              style={{
                display: 'flex',
                background: 'var(--md-surface-variant)',
                borderRadius: '12px',
                padding: '3px',
                border: '1px solid var(--md-outline)',
              }}
            >
              <button
                onClick={() => setPreviewMode('editor')}
                style={{
                  background: previewMode === 'editor' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: previewMode === 'editor' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit3 size={14} /> Form
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                style={{
                  background: previewMode === 'preview' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: previewMode === 'preview' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={() => setPreviewMode('split')}
                style={{
                  background: previewMode === 'split' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: previewMode === 'split' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Split
              </button>
            </div>

            <button
              onClick={handlePrintDownload}
              style={{
                background: 'var(--md-violet-gradient)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>

        {/* Wizard Step Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { id: 'personal', label: '1. Personal Info', icon: FileText },
            { id: 'experience', label: '2. Experience', icon: Briefcase },
            { id: 'education', label: '3. Education', icon: GraduationCap },
            { id: 'skills', label: '4. Skills Matrix', icon: Code2 },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setActiveStep(st.id as any);
                if (previewMode === 'preview') setPreviewMode('editor');
              }}
              style={{
                background: activeStep === st.id ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                border: `1px solid ${activeStep === st.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: activeStep === st.id ? 800 : 600,
                color: activeStep === st.id ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <st.icon size={15} color={activeStep === st.id ? '#6366f1' : 'var(--md-text-muted)'} />
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container: Split or Full */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            previewMode === 'split'
              ? '1fr 1fr'
              : previewMode === 'editor'
              ? '1fr'
              : '1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT / EDITOR PANEL */}
        {(previewMode === 'editor' || previewMode === 'split') && (
          <div className="m3-surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* STEP 1: Personal Info */}
            {activeStep === 'personal' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', marginBottom: '16px' }}>
                  Personal & Career Summary
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={cvData.full_name}
                      onChange={(e) => setCvData({ ...cvData, full_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-outline)',
                        background: 'var(--md-surface-variant)',
                        color: 'var(--md-text-primary)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-outline)',
                        background: 'var(--md-surface-variant)',
                        color: 'var(--md-text-primary)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-outline)',
                        background: 'var(--md-surface-variant)',
                        color: 'var(--md-text-primary)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      value={cvData.headline}
                      onChange={(e) => setCvData({ ...cvData, headline: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-outline)',
                        background: 'var(--md-surface-variant)',
                        color: 'var(--md-text-primary)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>
                      Professional Summary
                    </label>
                    <button
                      onClick={handleImproveSummary}
                      disabled={isImprovingSection === 'summary'}
                      style={{
                        background: 'var(--md-primary-container)',
                        color: 'var(--md-on-primary-container)',
                        border: '1px solid var(--md-outline)',
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Sparkles size={13} />
                      {isImprovingSection === 'summary' ? 'Optimizing...' : 'Improve Wording (Metered AI)'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={cvData.summary}
                    onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                      color: 'var(--md-text-primary)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Experience */}
            {activeStep === 'experience' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
                    Work Experience & Roles
                  </h3>
                  <button
                    onClick={() => {
                      setCvData((prev) => ({
                        ...prev,
                        experience: [
                          ...prev.experience,
                          {
                            title: 'New Position',
                            company: 'Company Name',
                            period: '2025 - 2026',
                            highlights: ['Key achievement or impact description.'],
                          },
                        ],
                      }));
                    }}
                    style={{
                      background: 'var(--md-primary-container)',
                      color: 'var(--md-on-primary-container)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={14} /> Add Role
                  </button>
                </div>

                {cvData.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Role Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const next = [...cvData.experience];
                            next[idx].title = e.target.value;
                            setCvData({ ...cvData, experience: next });
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                            color: 'var(--md-text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const next = [...cvData.experience];
                            next[idx].company = e.target.value;
                            setCvData({ ...cvData, experience: next });
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                            color: 'var(--md-text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Period</label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => {
                          const next = [...cvData.experience];
                          next[idx].period = e.target.value;
                          setCvData({ ...cvData, experience: next });
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface)',
                          color: 'var(--md-text-primary)',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Key Accomplishments</span>
                        <button
                          onClick={() => {
                            const next = [...cvData.experience];
                            next[idx].highlights.push('New accomplishment detail.');
                            setCvData({ ...cvData, experience: next });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Bullet
                        </button>
                      </div>

                      {exp.highlights.map((hl, bIdx) => (
                        <div key={bIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={hl}
                            onChange={(e) => {
                              const next = [...cvData.experience];
                              next[idx].highlights[bIdx] = e.target.value;
                              setCvData({ ...cvData, experience: next });
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--md-outline)',
                              background: 'var(--md-surface)',
                              color: 'var(--md-text-primary)',
                              fontSize: '12.5px',
                            }}
                          />
                          <button
                            onClick={() => handleImproveBullet(idx, bIdx)}
                            title="Improve with AI (Metered)"
                            style={{
                              background: 'var(--md-primary-container)',
                              border: '1px solid var(--md-outline)',
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              color: 'var(--md-primary)',
                            }}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => {
                              const next = [...cvData.experience];
                              next[idx].highlights.splice(bIdx, 1);
                              setCvData({ ...cvData, experience: next });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 3: Education */}
            {activeStep === 'education' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', marginBottom: '14px' }}>
                  Education & Academic Credentials
                </h3>
                {cvData.education.map((edu, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Degree / Major</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const next = [...cvData.education];
                          next[idx].degree = e.target.value;
                          setCvData({ ...cvData, education: next });
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface)',
                          color: 'var(--md-text-primary)',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const next = [...cvData.education];
                            next[idx].institution = e.target.value;
                            setCvData({ ...cvData, education: next });
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                            color: 'var(--md-text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Graduation Year</label>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => {
                            const next = [...cvData.education];
                            next[idx].year = e.target.value;
                            setCvData({ ...cvData, education: next });
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                            color: 'var(--md-text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4: Skills Matrix */}
            {activeStep === 'skills' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', marginBottom: '14px' }}>
                  Technical Skills & Competencies
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    id="new-skill-input"
                    type="text"
                    placeholder="e.g. Next.js, Redis, GraphQL"
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                      color: 'var(--md-text-primary)',
                      fontSize: '13px',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const inp = document.getElementById('new-skill-input') as HTMLInputElement;
                      if (inp) {
                        handleAddSkill(inp.value);
                        inp.value = '';
                      }
                    }}
                    style={{
                      background: 'var(--md-violet-gradient)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Add Skill
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cvData.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        background: 'var(--md-surface-variant)',
                        border: '1px solid var(--md-outline)',
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--md-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {s}
                      <button
                        onClick={() => handleRemoveSkill(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--md-text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT / LIVE MATERIAL 3 PREVIEW */}
        {(previewMode === 'preview' || previewMode === 'split') && (
          <div
            id="cv-printable-document"
            style={{
              background: 'var(--md-surface)',
              borderRadius: '16px',
              border: '1px solid var(--md-outline)',
              boxShadow: 'var(--shadow-md)',
              padding: '36px',
              fontFamily: 'Inter, -apple-system, sans-serif',
              color: 'var(--md-text-primary)',
            }}
          >
            {/* Header */}
            <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '16px', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--md-text-primary)' }}>
                {cvData.full_name}
              </h1>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1', margin: '0 0 10px 0' }}>
                {cvData.headline}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                <span>{cvData.email}</span>
                <span>•</span>
                <span>{cvData.phone}</span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Executive Summary
              </h4>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--md-text-secondary)', margin: 0 }}>
                {cvData.summary}
              </p>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Experience & Impact
              </h4>
              {cvData.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--md-text-primary)' }}>{exp.title}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>{exp.period}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#6366f1', fontWeight: 600, marginBottom: '6px' }}>
                    {exp.company}
                  </div>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12.5px', color: 'var(--md-text-secondary)', lineHeight: 1.5 }}>
                    {exp.highlights.map((h, hi) => (
                      <li key={hi} style={{ marginBottom: '4px' }}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Education
              </h4>
              {cvData.education.map((edu, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--md-text-primary)' }}>{edu.degree}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>{edu.institution}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>{edu.year}</span>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Technical Competencies
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {cvData.skills.join(' • ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
