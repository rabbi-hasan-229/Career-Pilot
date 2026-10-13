-- Seed Data for Career Pilot
-- Curated Roles, Gamified Milestones & Initial Quizzes

-- 1. Insert Initial Achievements
insert into public.achievements (id, title, description, icon_name, tier, xp_bonus) values
('first_step', 'First Footprint', 'Complete your first learning node on the island', 'footprints', 'bronze', 50),
('quiz_master_1', 'Riddle Solver', 'Pass your first checkpoint quiz with 100% accuracy', 'brain', 'bronze', 50),
('streak_3', 'Momentum Seeker', 'Maintain a 3-day learning streak', 'flame', 'silver', 100),
('streak_7', 'Island Pioneer', 'Maintain a 7-day learning streak', 'trophy', 'gold', 250),
('role_graduate', 'Quest Champion', 'Complete an entire career roadmap', 'crown', 'platinum', 1000)
on conflict (id) do nothing;

-- 2. Insert Curated Role: UI/UX Designer (Matches mockup)
insert into public.roles (id, slug, title, description, category, icon_name, source) values
('11111111-1111-1111-1111-111111111111', 'ui-ux-designer', 'UI/UX Designer', 'Master wireframing, design systems, visual hierarchy, and interactive prototyping.', 'Design', 'palette', 'curated'),
('22222222-2222-2222-2222-222222222222', 'frontend-developer', 'Junior Frontend Developer', 'Master semantic HTML, CSS layout mastery, JavaScript engine fundamentals, and React.', 'Engineering', 'code', 'curated')
on conflict (slug) do nothing;

-- 3. Milestones for UI/UX Designer
insert into public.role_milestones (role_id, position, title, description, island_zone, effort_hours) values
('11111111-1111-1111-1111-111111111111', 1, 'Design Foundations & Color Theory', 'Explore color palettes, typography rhythm, and visual balance on the coastal shore.', 'Coastal Shore', 15),
('11111111-1111-1111-1111-111111111111', 2, 'Figma Mastery & Component Systems', 'Build atomic components, auto-layouts, and design tokens in the Workshop Citadel.', 'Workshop Citadel', 25),
('11111111-1111-1111-1111-111111111111', 3, 'User Research & Wireframing', 'Conduct user interviews, heuristic analysis, and low-fidelity prototypes at the Harbor.', 'Discovery Harbor', 20),
('11111111-1111-1111-1111-111111111111', 4, 'Portfolio & Micro-Interactions', 'Polish interactive prototypes, animations, and publish your hero portfolio.', 'Summit Lighthouse', 30);

-- 4. Milestones for Frontend Developer
insert into public.role_milestones (role_id, position, title, description, island_zone, effort_hours) values
('22222222-2222-2222-2222-222222222222', 1, 'Web Foundations: HTML5 & Responsive CSS', 'Conquer layout models, Flexbox, Grid, and accessibility on the Starter Beach.', 'Starter Beach', 20),
('22222222-2222-2222-2222-222222222222', 2, 'Modern JavaScript & Async Engine', 'Master closures, async/await, DOM APIs, and state in the Logic Fortress.', 'Logic Fortress', 35),
('22222222-2222-2222-2222-222222222222', 3, 'React & Component Architecture', 'Build reactive UI trees, hooks, custom state, and routing in the Component Forest.', 'Component Forest', 40),
('22222222-2222-2222-2222-222222222222', 4, 'Production Polish & Portfolio Project', 'Connect Supabase backends, performance tuning, and deploy to Vercel/Cloudflare.', 'Cloud Summit', 25);
