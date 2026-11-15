-- Shared category baselines give custom roles a useful starting point in the
-- skill-gap view without presenting category-level data as role-specific.
create table public.career_category_skill_requirements (
  career_category text not null check (career_category in (
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
  )),
  skill_id uuid not null references public.skills(id) on delete cascade,
  importance smallint not null check (importance between 1 and 5),
  primary key (career_category, skill_id)
);

create index career_category_skill_requirements_rank_idx
  on public.career_category_skill_requirements (career_category, importance desc, skill_id);
create index career_category_skill_requirements_skill_idx
  on public.career_category_skill_requirements (skill_id);

alter table public.career_category_skill_requirements enable row level security;
create policy "authenticated read category skill baselines"
  on public.career_category_skill_requirements
  for select to authenticated using (true);
revoke all on public.career_category_skill_requirements from public, anon, authenticated;
grant select on public.career_category_skill_requirements to authenticated;

-- Build each baseline from skills that recur most often in curated roles in
-- that category. Generic practices common to every career are excluded so the
-- baseline remains useful for comparing domain competencies.
with category_skill_coverage as (
  select
    career_role.category as career_category,
    requirement.skill_id,
    count(distinct requirement.role_slug) as role_count,
    avg(requirement.importance)::numeric as average_importance,
    sum(requirement.importance)::integer as total_importance
  from public.roles as career_role
  join public.role_skill_requirements as requirement on requirement.role_slug = career_role.slug
  join public.skills as skill on skill.id = requirement.skill_id
  where career_role.category in (
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
  )
    and skill.name not in (
      'Environment Setup',
      'Best Practices',
      'Performance Tuning',
      'System Design',
      'Interview Portfolio'
    )
  group by career_role.category, requirement.skill_id
), ranked_category_skills as (
  select
    career_category,
    skill_id,
    greatest(1, least(5, round(average_importance)::integer))::smallint as importance,
    row_number() over (
      partition by career_category
      order by role_count desc, total_importance desc, skill_id
    ) as category_rank
  from category_skill_coverage
)
insert into public.career_category_skill_requirements (career_category, skill_id, importance)
select career_category, skill_id, importance
from ranked_category_skills
where category_rank <= 8;
