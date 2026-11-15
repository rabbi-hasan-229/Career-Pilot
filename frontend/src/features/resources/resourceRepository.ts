import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { CareerCategory } from '../roadmap/careerCatalog';

export interface LearningResource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  provider: string | null;
  resource_type: string;
  category: CareerCategory | null;
  tags: string[];
}

const CURATED_FALLBACK_RESOURCES: LearningResource[] = [
  {
    id: 'res-web-mdn',
    title: 'MDN Web Docs — Modern Web Architecture & APIs',
    description: 'Authoritative reference for HTTP, DOM performance, Fetch, Storage, and Web Security patterns.',
    url: 'https://developer.mozilla.org/en-US/docs/Web',
    provider: 'MDN',
    resource_type: 'Documentation',
    category: 'Software & Web',
    tags: ['web', 'api', 'http', 'javascript', 'typescript'],
  },
  {
    id: 'res-react-docs',
    title: 'React Official Docs — Thinking in React & Hooks',
    description: 'Interactive guide to state management, effects, server components, and rendering performance.',
    url: 'https://react.dev/learn',
    provider: 'React',
    resource_type: 'Guide',
    category: 'Software & Web',
    tags: ['react', 'frontend', 'ui', 'components'],
  },
  {
    id: 'res-aws-serverless',
    title: 'AWS Serverless Land — Event-Driven Patterns',
    description: 'Production serverless patterns covering AWS Lambda, API Gateway, SQS, Step Functions, and cold-start tuning.',
    url: 'https://serverlessland.com/patterns',
    provider: 'AWS',
    resource_type: 'Patterns',
    category: 'Cloud & DevOps',
    tags: ['serverless', 'lambda', 'aws', 'cloud', 'event-driven'],
  },
  {
    id: 'res-system-design',
    title: 'Architecture & Distributed Systems Playbook',
    description: 'Practical patterns for caching, rate limiting, idempotency, observability, and scaling databases.',
    url: 'https://roadmap.sh/system-design',
    provider: 'roadmap.sh',
    resource_type: 'Playbook',
    category: 'Software & Web',
    tags: ['system design', 'backend', 'scaling', 'serverless', 'database'],
  },
  {
    id: 'res-owasp-api',
    title: 'OWASP API Security Top 10 & Auth Hardening',
    description: 'Essential checklist covering BOLA/IDOR, token validation, rate limiting, and least-privilege IAM.',
    url: 'https://owasp.org/API-Security/',
    provider: 'OWASP',
    resource_type: 'Security Guide',
    category: 'Cybersecurity',
    tags: ['security', 'auth', 'api', 'iam', 'owasp'],
  },
  {
    id: 'res-k8s-docs',
    title: 'Kubernetes & Cloud Native Foundations',
    description: 'Deployment patterns, health probes, autoscaling, Terraform IaC workflows, and SLO monitoring.',
    url: 'https://kubernetes.io/docs/concepts/',
    provider: 'CNCF',
    resource_type: 'Documentation',
    category: 'Cloud & DevOps',
    tags: ['kubernetes', 'devops', 'docker', 'cloud', 'terraform'],
  },
  {
    id: 'res-ai-evals',
    title: 'Practical LLM Engineering & RAG Evaluation',
    description: 'Grounded retrieval architecture, prompt reliability, latency optimization, and automated eval suites.',
    url: 'https://platform.openai.com/docs/guides/evals',
    provider: 'OpenAI Docs',
    resource_type: 'Guide',
    category: 'AI & Data Science',
    tags: ['ai', 'llm', 'rag', 'ml', 'evaluation'],
  },
  {
    id: 'res-a11y-wcag',
    title: 'Web.dev Accessibility & Core Web Vitals',
    description: 'Practical guides on semantic landmarks, keyboard navigation, contrast, and responsive performance.',
    url: 'https://web.dev/learn/accessibility',
    provider: 'Google Chrome',
    resource_type: 'Course',
    category: 'UI/UX & Product Design',
    tags: ['ux', 'ui', 'accessibility', 'design', 'performance'],
  },
];

function searchFallbackResources(query: string, category: CareerCategory | 'all'): LearningResource[] {
  const term = query.trim().toLowerCase();
  const byCategory = category === 'all'
    ? CURATED_FALLBACK_RESOURCES
    : CURATED_FALLBACK_RESOURCES.filter(
        (item) => item.category === category || (category === 'Software & Web' && item.tags.includes('serverless'))
      );
  const base = byCategory.length > 0 ? byCategory : CURATED_FALLBACK_RESOURCES;
  if (!term) return base;
  return base.filter((item) =>
    `${item.title} ${item.description ?? ''} ${item.tags.join(' ')}`.toLowerCase().includes(term)
  );
}

export async function searchLearningResources(
  query: string,
  category: CareerCategory | 'all',
): Promise<LearningResource[]> {
  if (!isSupabaseConfigured()) {
    return searchFallbackResources(query, category);
  }

  let request = supabase
    .from('resources')
    .select('id,title,description,url,provider,resource_type,category,tags')
    .eq('is_published', true)
    .order('title', { ascending: true })
    .limit(60);

  if (category !== 'all') request = request.eq('category', category);
  const term = query.trim().slice(0, 120);
  if (term) request = request.textSearch('search_vector', term, { type: 'websearch', config: 'english' });

  const { data, error } = await request;
  if (error) {
    return searchFallbackResources(query, category);
  }
  const rows = (data ?? []) as LearningResource[];
  return rows.length > 0 ? rows : searchFallbackResources(query, category);
}
