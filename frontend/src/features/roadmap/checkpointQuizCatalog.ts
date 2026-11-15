import type { CareerCategory } from './careerCatalog';

export type CheckpointQuizTemplateId =
  | `cp_phase_${1 | 2 | 3 | 4}`
  | `cp_full_stack_p${1 | 2 | 3 | 4}`
  | `cp_frontend_p${1 | 2 | 3 | 4}`
  | `cp_backend_p${1 | 2 | 3 | 4}`
  | `cp_nextjs_p${1 | 2 | 3 | 4}`
  | `cp_vue_p${1 | 2 | 3 | 4}`
  | `cp_rust_p${1 | 2 | 3 | 4}`
  | `cp_dotnet_p${1 | 2 | 3 | 4}`
  | `cp_domain_software_p${1 | 2 | 3 | 4}`
  | `cp_domain_ai_data_p${1 | 2 | 3 | 4}`
  | `cp_domain_cloud_p${1 | 2 | 3 | 4}`
  | `cp_domain_cybersecurity_p${1 | 2 | 3 | 4}`
  | `cp_domain_mobile_p${1 | 2 | 3 | 4}`
  | `cp_domain_game_p${1 | 2 | 3 | 4}`
  | `cp_domain_design_p${1 | 2 | 3 | 4}`
  | `cp_domain_product_p${1 | 2 | 3 | 4}`
  | `cp_domain_qa_p${1 | 2 | 3 | 4}`
  | `cp_domain_fintech_p${1 | 2 | 3 | 4}`
  | `cp_domain_hardware_p${1 | 2 | 3 | 4}`
  | `cp_domain_enterprise_p${1 | 2 | 3 | 4}`;

const featuredRoleQuizPrefixes: Record<string, string> = {
  'full-stack-engineer': 'cp_full_stack',
  'frontend-engineer': 'cp_frontend',
  'backend-specialist': 'cp_backend',
  'next-js-full-stack-specialist': 'cp_nextjs',
  'vue-js-nuxt-3-developer': 'cp_vue',
  'rust-systems-programmer': 'cp_rust',
  'c-net-cloud-architect': 'cp_dotnet',
};

const categoryQuizPrefixes: Record<CareerCategory, string> = {
  'Software & Web': 'cp_domain_software',
  'AI & Data Science': 'cp_domain_ai_data',
  'Cloud & DevOps': 'cp_domain_cloud',
  Cybersecurity: 'cp_domain_cybersecurity',
  'Mobile & Multiplatform': 'cp_domain_mobile',
  'Game Dev & 3D': 'cp_domain_game',
  'UI/UX & Product Design': 'cp_domain_design',
  'Product & Agile Leadership': 'cp_domain_product',
  'QA & Reliability': 'cp_domain_qa',
  'FinTech & Web3': 'cp_domain_fintech',
  'Hardware & Robotics': 'cp_domain_hardware',
  'Enterprise & Applied Tech': 'cp_domain_enterprise',
};

export function getCheckpointQuizTemplateId(
  roleSlug: string,
  weekIndex: number,
  totalWeeks: number,
  category: CareerCategory = 'Software & Web'
): CheckpointQuizTemplateId {
  const phase = Math.min(4, Math.floor((weekIndex * 4) / Math.max(1, totalWeeks)) + 1);
  const prefix = featuredRoleQuizPrefixes[roleSlug] || categoryQuizPrefixes[category];
  return `${prefix}_p${phase}` as CheckpointQuizTemplateId;
}
