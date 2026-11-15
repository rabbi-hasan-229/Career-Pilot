import React, { useEffect, useState } from 'react';
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
  Save,
  Layout,
} from 'lucide-react';
import type { CVData, CVTemplateId, Profile } from '../types';
import { loadCV, saveCV } from '../features/cv/cvRepository';
import { requestAI } from '../features/ai/aiGateway';
import { CVPreviewDocument } from '../features/cv/CVTemplates';
import { CV_TEMPLATES } from '../features/cv/cvTemplatesCatalog';
import { CVSkeleton } from './SkeletonScreen';

interface Props {
  profile: Profile;
  onAIUsageChanged?: () => Promise<void> | void;
  onToast: (msg: string) => void;
}

const emptyCV = (profile: Profile): CVData => ({
  full_name: profile.full_name,
  email: profile.email || '',
  phone: profile.phone || '',
  headline: profile.target_role || '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
});

export const CVBuilderView: React.FC<Props> = ({
  profile,
  onAIUsageChanged,
  onToast,
}) => {
  const [cvData, setCvData] = useState<CVData>(() => emptyCV(profile));
  const [cvDocumentId, setCvDocumentId] = useState<string | null>(null);
  const [loadedCVForProfileId, setLoadedCVForProfileId] = useState<string | null>(null);
  const [isSavingCV, setIsSavingCV] = useState(false);
  const [loadError, setLoadError] = useState<{ profileId: string; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<
    'personal' | 'experience' | 'education' | 'skills' | 'preview'
  >('personal');
  const [isImprovingSection, setIsImprovingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview' | 'split'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'split' : 'editor'
  );
  const isLoadingCV = loadedCVForProfileId !== profile.id;
  const cvError = (loadError?.profileId === profile.id ? loadError.message : null) ?? saveError;

  useEffect(() => {
    let active = true;
    void loadCV(profile.id).then((saved) => {
      if (!active) return;
      setCvDocumentId(saved?.id || null);
      setCvData(saved?.data || emptyCV(profile));
      setLoadError(null);
    }).catch(() => {
      if (active) setLoadError({ profileId: profile.id, message: 'Your saved resume could not be loaded.' });
    }).finally(() => {
      if (active) setLoadedCVForProfileId(profile.id);
    });
    return () => { active = false; };
  }, [profile]);

  const handleSaveCV = async () => {
    setIsSavingCV(true);
    setSaveError(null);
    try {
      const id = await saveCV(profile.id, cvDocumentId, cvData);
      setCvDocumentId(id);
      onToast('Resume saved to your account.');
    } catch {
      setSaveError('Your resume could not be saved. Check your connection and try again.');
    } finally {
      setIsSavingCV(false);
    }
  };

  // Explicit, server-metered rewrite requests send only the selected section.
  const handleImproveSummary = async () => {
    if (!cvData.summary.trim()) {
      onToast('Write a first draft before asking AI to improve your summary.');
      return;
    }

    setIsImprovingSection('summary');
    try {
      const result = await requestAI<{ improved_text: string }>('cv', {
        section: 'summary',
        text: cvData.summary,
        target_role: cvData.headline || profile.target_role,
      });
      setCvData((prev) => ({
        ...prev,
        summary: result.response.improved_text,
      }));
      onToast('AI wording applied. Review the claims and save your resume when ready.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Could not improve the summary.');
    } finally {
      setIsImprovingSection(null);
      await onAIUsageChanged?.();
    }
  };

  const handleImproveBullet = async (expIndex: number, bulletIndex: number) => {
    const sourceText = cvData.experience[expIndex]?.highlights[bulletIndex];
    if (!sourceText?.trim()) {
      onToast('Add a draft accomplishment before asking AI to improve it.');
      return;
    }

    const sectionId = `bullet_${expIndex}_${bulletIndex}`;
    setIsImprovingSection(sectionId);
    try {
      const result = await requestAI<{ improved_text: string }>('cv', {
        section: 'bullet',
        text: sourceText,
        target_role: cvData.headline || profile.target_role,
      });
      setCvData((prev) => {
        const nextExp = [...prev.experience];
        if (!nextExp[expIndex]?.highlights[bulletIndex]) return prev;
        nextExp[expIndex] = { ...nextExp[expIndex], highlights: [...nextExp[expIndex].highlights] };
        nextExp[expIndex].highlights[bulletIndex] = result.response.improved_text;
        return { ...prev, experience: nextExp };
      });
      onToast('AI wording applied. Confirm it accurately describes your work, then save your resume.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Could not improve this accomplishment.');
    } finally {
      setIsImprovingSection(null);
      await onAIUsageChanged?.();
    }
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
      <div className="m3-surface-card no-print" style={{ marginBottom: '20px', padding: '20px 24px' }}>
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
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                margin: '0 0 4px 0',
              }}
            >
              Resume Builder
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: 0 }}>
              Draft, format, and export as PDF.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* View Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'var(--md-surface-variant)',
                borderRadius: '10px',
                padding: '3px',
                border: '1px solid var(--md-outline)',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewMode('editor')}
                style={{
                  background: previewMode === 'editor' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: previewMode === 'editor' ? 'var(--md-text-primary)' : 'var(--md-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Edit3 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('preview')}
                style={{
                  background: previewMode === 'preview' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: previewMode === 'preview' ? 'var(--md-text-primary)' : 'var(--md-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Eye size={13} /> Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('split')}
                style={{
                  background: previewMode === 'split' ? 'var(--md-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: previewMode === 'split' ? 'var(--md-text-primary)' : 'var(--md-text-secondary)',
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
              type="button"
              onClick={() => void handleSaveCV()}
              disabled={isLoadingCV || isSavingCV || Boolean(cvError)}
              style={{
                background: 'var(--md-surface)',
                color: 'var(--md-text-primary)',
                border: '1px solid var(--md-outline)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSavingCV ? 'wait' : 'pointer',
                opacity: isSavingCV ? 0.7 : 1,
              }}
            >
              <Save size={14} /> {isSavingCV ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handlePrintDownload}
              style={{
                background: 'var(--md-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--md-outline)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'personal', label: 'Personal', icon: FileText },
            { id: 'experience', label: 'Experience', icon: Briefcase },
            { id: 'education', label: 'Education', icon: GraduationCap },
            { id: 'skills', label: 'Skills', icon: Code2 },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setActiveStep(st.id as any);
                if (previewMode === 'preview') setPreviewMode('editor');
              }}
              className={`m3-tab-pill ${activeStep === st.id ? 'active' : ''}`}
            >
              <st.icon size={14} />
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {isLoadingCV && <CVSkeleton />}
      {cvError && <p role="alert" style={{ color: '#B91C1C', fontSize: '13px' }}>{cvError}</p>}

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
                      title="Sends only this summary to the configured AI provider. Review the result before saving."
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
                      {isImprovingSection === 'summary' ? 'Improving…' : 'Improve with AI'}
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
                          type="button"
                          onClick={() => {
                            const next = [...cvData.experience];
                            next[idx].highlights.push('New accomplishment detail.');
                            setCvData({ ...cvData, experience: next });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--md-primary)',
                            fontSize: '11.5px',
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
                            disabled={isImprovingSection === `bullet_${idx}_${bIdx}`}
                            title="Sends only this bullet to the configured AI provider. Review the result before saving."
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
                    type="button"
                    onClick={() => {
                      const inp = document.getElementById('new-skill-input') as HTMLInputElement;
                      if (inp) {
                        handleAddSkill(inp.value);
                        inp.value = '';
                      }
                    }}
                    style={{
                      background: 'var(--md-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Add
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

        {/* RIGHT / LIVE MULTI-TEMPLATE PREVIEW */}
        {(previewMode === 'preview' || previewMode === 'split') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            {/* Template Selector Bar */}
            <div
              className="m3-surface-card no-print"
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layout size={15} color="var(--md-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                    Template
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                  {CV_TEMPLATES.find((t) => t.id === (cvData.template_id || 'modern'))?.description}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CV_TEMPLATES.map((tmpl) => {
                  const isSelected = (cvData.template_id || 'modern') === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setCvData((prev) => ({ ...prev, template_id: tmpl.id as CVTemplateId }))}
                      className={`m3-tab-pill ${isSelected ? 'active' : ''}`}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: tmpl.accentColor,
                          display: 'inline-block',
                        }}
                      />
                      {tmpl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Rendered Template Document */}
            <CVPreviewDocument data={cvData} templateId={cvData.template_id || 'modern'} />
          </div>
        )}
      </div>
    </div>
  );
};
