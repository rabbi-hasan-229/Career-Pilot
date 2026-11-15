import type { CVTemplateId } from '../../types';

export interface CVTemplateMeta {
  id: CVTemplateId;
  name: string;
  badge: string;
  description: string;
  accentColor: string;
}

export const CV_TEMPLATES: CVTemplateMeta[] = [
  {
    id: 'modern',
    name: 'Modern Tech',
    badge: 'Popular',
    description: 'Sleek dark/indigo accents, modern badges, and high-impact visual hierarchy.',
    accentColor: '#6366f1',
  },
  {
    id: 'minimalist',
    name: 'Minimalist ATS',
    badge: 'ATS Safe',
    description: 'Clean monochrome formatting engineered for maximum Applicant Tracking System parser fidelity.',
    accentColor: '#18181b',
  },
  {
    id: 'executive',
    name: 'Classic Executive',
    badge: 'Prestige',
    description: 'Sophisticated navy palette with serif typography, formal headers, and traditional structure.',
    accentColor: '#1e3a8a',
  },
  {
    id: 'creative',
    name: 'Creative Split',
    badge: 'Design',
    description: 'Two-column sidebar layout highlighting contact and competencies alongside experience.',
    accentColor: '#8b5cf6',
  },
  {
    id: 'compact',
    name: 'Compact One-Page',
    badge: 'Dense',
    description: 'High-density layout designed to fit comprehensive experience onto a single printed page.',
    accentColor: '#059669',
  },
];
