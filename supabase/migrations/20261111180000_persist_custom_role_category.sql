alter table public.profiles
  add column target_role_category text
  check (target_role_category in (
    'Software & Web',
    'AI & Data Science',
    'Cloud & DevOps',
    'Cybersecurity',
    'Mobile & Multiplatform',
    'Game Dev & 3D',
    'UI/UX & Product Design',
    'Product & Agile Leadership',
    'QA & Reliability',
    'FinTech & Web3',
    'Hardware & Robotics',
    'Enterprise & Applied Tech'
  ));
