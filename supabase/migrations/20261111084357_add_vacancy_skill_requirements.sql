-- Attach the curated vacancies to the shared skill catalog so match scores
-- are derived from real requirement rows instead of frontend placeholders.
insert into public.vacancy_skills (vacancy_id, skill_id)
select v.id, s.id
from (values
  ('cccc0001-0000-0000-0000-000000000001'::uuid, 'Data Structures & Algorithms'),
  ('cccc0001-0000-0000-0000-000000000001'::uuid, 'PostgreSQL & SQL Modeling'),
  ('cccc0001-0000-0000-0000-000000000001'::uuid, 'TypeScript & React Architecture'),
  ('cccc0001-0000-0000-0000-000000000001'::uuid, 'RESTful API & Deno/Node.js'),
  ('cccc0002-0000-0000-0000-000000000002'::uuid, 'Data Structures & Algorithms'),
  ('cccc0002-0000-0000-0000-000000000002'::uuid, 'PostgreSQL & SQL Modeling'),
  ('cccc0002-0000-0000-0000-000000000002'::uuid, 'RESTful API & Deno/Node.js'),
  ('cccc0002-0000-0000-0000-000000000002'::uuid, 'System Design & Scalability')
) as requirement(vacancy_id, skill_name)
join public.vacancies v on v.id = requirement.vacancy_id
join public.skills s on s.name = requirement.skill_name
on conflict (vacancy_id, skill_id) do nothing;
