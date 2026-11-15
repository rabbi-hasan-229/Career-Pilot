import React from 'react';
import type { CVData, CVTemplateId } from '../../types';

interface Props {
  data: CVData;
  templateId?: CVTemplateId;
}

export const CVPreviewDocument: React.FC<Props> = ({ data, templateId = 'modern' }) => {
  const renderTemplate = () => {
    switch (templateId) {
      case 'minimalist':
        return <MinimalistTemplate data={data} />;
      case 'executive':
        return <ExecutiveTemplate data={data} />;
      case 'creative':
        return <CreativeTemplate data={data} />;
      case 'compact':
        return <CompactTemplate data={data} />;
      case 'modern':
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return (
    <div id="cv-printable-document" style={{ width: '100%' }}>
      {renderTemplate()}
    </div>
  );
};

/* -------------------------------------------------------------
   1. MODERN TECH TEMPLATE
------------------------------------------------------------- */
const ModernTemplate: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div
      style={{
        background: 'var(--md-surface, #ffffff)',
        borderRadius: '16px',
        border: '1px solid var(--md-outline, #e2e8f0)',
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.05))',
        padding: '36px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: 'var(--md-text-primary, #0f172a)',
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: 'var(--md-text-primary, #0f172a)' }}>
          {data.full_name || 'Your Full Name'}
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#6366f1', margin: '0 0 10px 0' }}>
          {data.headline || 'Target Career Role'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12.5px', color: 'var(--md-text-secondary, #64748b)' }}>
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>•</span>}
          {data.phone && <span>{data.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Executive Summary
          </h4>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--md-text-secondary, #475569)', margin: 0 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            Experience & Achievements
          </h4>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '14px', fontWeight: 700, color: 'var(--md-text-primary, #0f172a)' }}>{exp.title}</strong>
                <span style={{ fontSize: '12px', color: 'var(--md-text-secondary, #64748b)' }}>{exp.period}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, marginBottom: '6px' }}>
                {exp.company}
              </div>
              {exp.highlights.length > 0 && (
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12.5px', color: 'var(--md-text-secondary, #475569)', lineHeight: 1.5 }}>
                  {exp.highlights.map((h, hi) => (
                    <li key={hi} style={{ marginBottom: '4px' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Education & Certifications
          </h4>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--md-text-primary, #0f172a)' }}>{edu.degree}</strong>
                <div style={{ fontSize: '12px', color: 'var(--md-text-secondary, #64748b)' }}>{edu.institution}</div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary, #64748b)' }}>{edu.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Technical Competencies
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.skills.map((s) => (
              <span
                key={s}
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   2. MINIMALIST ATS TEMPLATE
------------------------------------------------------------- */
const MinimalistTemplate: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        color: '#111827',
        borderRadius: '16px',
        border: '1px solid #d1d5db',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '36px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        lineHeight: 1.45,
      }}
    >
      {/* Centered ATS Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #111827', paddingBottom: '14px', marginBottom: '18px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {data.full_name || 'Your Full Name'}
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 6px 0', color: '#374151' }}>
          {data.headline || 'Target Career Role'}
        </p>
        <div style={{ fontSize: '12px', color: '#4b5563' }}>
          {[data.email, data.phone].filter(Boolean).join(' | ')}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', margin: '0 0 8px 0' }}>
            Professional Summary
          </h2>
          <p style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#374151', margin: 0 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', margin: '0 0 10px 0' }}>
            Work Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{exp.title} — {exp.company}</strong>
                <span style={{ fontSize: '11.5px', color: '#6b7280' }}>{exp.period}</span>
              </div>
              {exp.highlights.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                  {exp.highlights.map((h, hi) => (
                    <li key={hi} style={{ marginBottom: '3px' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', margin: '0 0 8px 0' }}>
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><strong>{edu.degree}</strong>, {edu.institution}</span>
              <span style={{ color: '#6b7280' }}>{edu.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h2 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', margin: '0 0 6px 0' }}>
            Core Competencies
          </h2>
          <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
            {data.skills.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   3. CLASSIC EXECUTIVE TEMPLATE
------------------------------------------------------------- */
const ExecutiveTemplate: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '16px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        padding: '40px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        lineHeight: 1.6,
      }}
    >
      {/* Executive Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.02em', color: '#1e3a8a' }}>
          {data.full_name || 'Your Full Name'}
        </h1>
        <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', marginBottom: '8px' }}>
          {data.headline || 'Target Career Role'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', fontFamily: 'sans-serif', color: '#64748b' }}>
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
        </div>
        <div style={{ width: '60px', height: '2px', background: '#1e3a8a', margin: '14px auto 0' }} />
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            Executive Overview
          </h3>
          <p style={{ fontSize: '13px', color: '#334155', margin: 0, textAlign: 'justify' }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '14px' }}>
            Leadership & Professional Experience
          </h3>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{exp.title}</strong>
                <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', fontFamily: 'sans-serif' }}>{exp.period}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 600, marginBottom: '6px', fontFamily: 'sans-serif' }}>
                {exp.company}
              </div>
              {exp.highlights.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: '12.5px', color: '#334155' }}>
                  {exp.highlights.map((h, hi) => (
                    <li key={hi} style={{ marginBottom: '4px' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px' }}>
            Academic Credentials
          </h3>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{edu.degree}</strong>
                <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>{edu.institution}</div>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'sans-serif' }}>{edu.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            Domain Expertise
          </h3>
          <p style={{ fontSize: '12.5px', color: '#334155', fontFamily: 'sans-serif', margin: 0 }}>
            {data.skills.join('  •  ')}
          </p>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   4. CREATIVE SPLIT TEMPLATE (2-Column)
------------------------------------------------------------- */
const CreativeTemplate: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 32%) 1fr',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Left Column / Sidebar */}
      <div style={{ background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
          {data.full_name || 'Your Full Name'}
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6', margin: '0 0 20px 0' }}>
          {data.headline || 'Target Career Role'}
        </p>

        {/* Contact info */}
        <div style={{ marginBottom: '24px', fontSize: '11.5px', color: '#475569' }}>
          <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '8px' }}>
            Contact
          </strong>
          {data.email && <div style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{data.email}</div>}
          {data.phone && <div style={{ marginBottom: '4px' }}>{data.phone}</div>}
        </div>

        {/* Skills Column */}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '8px' }}>
              Skills
            </strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {data.skills.map((s) => (
                <span
                  key={s}
                  style={{
                    background: '#ede9fe',
                    color: '#6d28d9',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education Column */}
        {data.education.length > 0 && (
          <div>
            <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '8px' }}>
              Education
            </strong>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px', fontSize: '11.5px' }}>
                <strong style={{ color: '#0f172a' }}>{edu.degree}</strong>
                <div style={{ color: '#64748b' }}>{edu.institution}</div>
                <div style={{ color: '#94a3b8', fontSize: '10.5px' }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column / Main Feed */}
      <div style={{ padding: '30px' }}>
        {data.summary && (
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b5cf6', marginBottom: '8px' }}>
              About Me
            </h3>
            <p style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#334155', margin: 0 }}>
              {data.summary}
            </p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b5cf6', marginBottom: '14px' }}>
              Experience
            </h3>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{exp.title}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{exp.period}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#8b5cf6', fontWeight: 600, marginBottom: '6px' }}>
                  {exp.company}
                </div>
                {exp.highlights.length > 0 && (
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                    {exp.highlights.map((h, hi) => (
                      <li key={hi} style={{ marginBottom: '3px' }}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   5. COMPACT ONE-PAGE TEMPLATE
------------------------------------------------------------- */
const CompactTemplate: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '16px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '24px 28px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        lineHeight: 1.4,
      }}
    >
      {/* Compact Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #059669', paddingBottom: '10px', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            {data.full_name || 'Your Full Name'}
          </h1>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
            {data.headline || 'Target Career Role'}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
          <div>{data.email}</div>
          <div>{data.phone}</div>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11.5px', color: '#334155', margin: 0, lineHeight: 1.45 }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '8px' }}>
            Professional Experience
          </h3>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span><strong>{exp.title}</strong>, <span style={{ color: '#059669' }}>{exp.company}</span></span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{exp.period}</span>
              </div>
              {exp.highlights.length > 0 && (
                <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                  {exp.highlights.map((h, hi) => (
                    <li key={hi}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '6px' }}>
            Education
          </h3>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span><strong>{edu.degree}</strong> — {edu.institution}</span>
              <span style={{ color: '#64748b' }}>{edu.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h3 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
            Key Skills
          </h3>
          <p style={{ fontSize: '11.5px', color: '#334155', margin: 0 }}>
            {data.skills.join(' • ')}
          </p>
        </div>
      )}
    </div>
  );
};
