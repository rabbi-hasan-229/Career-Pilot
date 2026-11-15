-- Save a career-goal change and replace its roadmap as one transaction. If
-- roadmap validation or insertion fails, the profile update rolls back too.
grant update (target_role_category) on table public.profiles to authenticated;

create or replace function public.save_user_career_plan(
  p_target_role text,
  p_target_role_category text,
  p_target_timeline_months integer,
  p_target_date date,
  p_daily_minutes integer,
  p_experience_level text,
  p_milestones jsonb,
  p_tasks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_target_role text := trim(coalesce(p_target_role, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not private.has_mfa_assurance() then
    raise exception 'Complete multi-factor verification before continuing' using errcode = '42501';
  end if;
  if char_length(v_target_role) not between 2 and 100 then
    raise exception 'Target role must be between 2 and 100 characters' using errcode = '22023';
  end if;
  if p_target_role_category is null or p_target_role_category not in (
    'Software & Web', 'AI & Data Science', 'Cloud & DevOps', 'Cybersecurity',
    'Mobile & Multiplatform', 'Game Dev & 3D', 'UI/UX & Product Design',
    'Product & Agile Leadership', 'QA & Reliability', 'FinTech & Web3',
    'Hardware & Robotics', 'Enterprise & Applied Tech'
  ) then
    raise exception 'Choose a supported career category' using errcode = '22023';
  end if;
  if p_target_timeline_months is null or p_target_timeline_months not between 1 and 60 then
    raise exception 'Timeline must be between 1 and 60 months' using errcode = '22023';
  end if;
  if p_target_date is null or p_target_date < current_date or p_target_date > current_date + 1825 then
    raise exception 'Target date must be within the next five years' using errcode = '22023';
  end if;
  if p_daily_minutes is null or p_daily_minutes not between 15 and 1440 then
    raise exception 'Daily study time must be between 15 and 1440 minutes' using errcode = '22023';
  end if;
  if p_experience_level is null or p_experience_level not in ('beginner', 'switcher', 'junior', 'mid') then
    raise exception 'Choose a supported experience level' using errcode = '22023';
  end if;

  update public.profiles
    set target_role = v_target_role,
        target_role_category = p_target_role_category,
        target_timeline_months = p_target_timeline_months,
        target_completion_date = p_target_date,
        daily_minutes = p_daily_minutes,
        experience_level = p_experience_level,
        has_completed_onboarding = true
    where id = v_user_id;
  if not found then
    raise exception 'Account profile could not be found' using errcode = 'P0002';
  end if;

  return public.create_user_roadmap(
    v_target_role,
    p_target_date,
    p_milestones,
    p_tasks
  );
end;
$$;

revoke all on function public.save_user_career_plan(text, text, integer, date, integer, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_user_career_plan(text, text, integer, date, integer, text, jsonb, jsonb)
  to authenticated;
