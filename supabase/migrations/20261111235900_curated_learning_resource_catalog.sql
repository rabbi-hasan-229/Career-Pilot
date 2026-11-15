alter table public.resources
  add column category text
    check (category in (
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
  add column tags text[] not null default '{}',
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(provider, '')), 'C') ||
    setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D')
  ) stored;

create index resources_published_search_idx
  on public.resources using gin (search_vector)
  where is_published;

create index resources_published_category_created_idx
  on public.resources (category, created_at desc)
  where is_published;

drop policy if exists "authenticated read published resources" on public.resources;
create policy "public read published resources"
  on public.resources for select to anon, authenticated
  using (is_published);
grant select on public.resources to anon, authenticated;
revoke insert, update, delete on public.resources from anon, authenticated;

-- The catalog contains public learning links only. Keep the seed rows repeatable
-- so a later content migration can safely introduce additional editorial fields.
insert into public.resources (
  title, description, url, provider, resource_type, est_minutes,
  category, tags, is_published
)
select seed.title, seed.description, seed.url, seed.provider, seed.resource_type,
       seed.est_minutes, seed.category, seed.tags, true
from (values
  ('Learn web development', 'A structured curriculum covering the foundations and core practices of modern front-end development.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development', 'MDN', 'curriculum', 30, 'Software & Web', array['HTML', 'CSS', 'JavaScript', 'accessibility']::text[]),
  ('React Quick Start', 'Learn the React concepts used to build interfaces, from components and state to events and rendering.', 'https://react.dev/learn', 'React', 'tutorial', 30, 'Software & Web', array['React', 'components', 'state', 'frontend']::text[]),
  ('Kaggle Learn', 'Short, hands-on courses for Python, data visualization, machine learning, and related data skills.', 'https://www.kaggle.com/learn/', 'Kaggle', 'course', 30, 'AI & Data Science', array['Python', 'data science', 'machine learning', 'practice']::text[]),
  ('PyTorch Tutorials', 'Official tutorials for building, training, and deploying machine-learning models with PyTorch.', 'https://docs.pytorch.org/tutorials/', 'PyTorch', 'tutorial', 30, 'AI & Data Science', array['deep learning', 'neural networks', 'machine learning', 'Python']::text[]),
  ('Kubernetes tutorials', 'Task-oriented tutorials for deploying, scaling, updating, and operating applications on Kubernetes.', 'https://kubernetes.io/docs/tutorials/', 'Kubernetes', 'tutorial', 30, 'Cloud & DevOps', array['Kubernetes', 'containers', 'operations', 'cloud']::text[]),
  ('AWS Skill Builder', 'Build cloud skills with official digital training, learning plans, and hands-on content from AWS.', 'https://skillbuilder.aws/', 'AWS', 'learning platform', 30, 'Cloud & DevOps', array['AWS', 'cloud', 'architecture', 'certification']::text[]),
  ('Web Security Academy', 'Learn application security through vulnerability guides and interactive, intentionally safe practice labs.', 'https://portswigger.net/web-security', 'PortSwigger', 'interactive labs', 30, 'Cybersecurity', array['web security', 'penetration testing', 'OWASP', 'labs']::text[]),
  ('Web Security Testing Guide', 'A comprehensive open-source guide to planning and performing web application security testing.', 'https://owasp.org/www-project-web-security-testing-guide/', 'OWASP', 'guide', 30, 'Cybersecurity', array['application security', 'testing', 'OWASP', 'web']::text[]),
  ('Learn Flutter', 'A guided path for building Flutter apps, including Dart fundamentals, app architecture, and practical examples.', 'https://docs.flutter.dev/learn', 'Flutter', 'curriculum', 30, 'Mobile & Multiplatform', array['Flutter', 'Dart', 'mobile', 'architecture']::text[]),
  ('Android training courses', 'Training pathways from Android developers for Compose, architecture, accessibility, and modern Android development.', 'https://developer.android.com/courses', 'Android Developers', 'course', 30, 'Mobile & Multiplatform', array['Android', 'Kotlin', 'Jetpack Compose', 'mobile']::text[]),
  ('Your first 2D game', 'A step-by-step Godot tutorial that takes you from editor basics to a complete small 2D game.', 'https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html', 'Godot', 'tutorial', 30, 'Game Dev & 3D', array['Godot', 'game development', '2D', 'GDScript']::text[]),
  ('Getting started with Unity', 'Choose a guided Unity pathway and build foundational skills through small game and real-time 3D projects.', 'https://unity.com/learn/get-started', 'Unity', 'learning pathway', 30, 'Game Dev & 3D', array['Unity', 'game development', '3D', 'C#']::text[]),
  ('Figma courses and collections', 'Hands-on courses covering design systems, components, prototyping, and practical interface design.', 'https://help.figma.com/hc/en-us/sections/23691657321239-Courses', 'Figma', 'course', 30, 'UI/UX & Product Design', array['Figma', 'UI design', 'design systems', 'prototyping']::text[]),
  ('WAI tutorials', 'Guidance for making common website components accessible, including navigation, images, forms, and tables.', 'https://www.w3.org/WAI/tutorials/', 'W3C WAI', 'tutorial', 30, 'UI/UX & Product Design', array['accessibility', 'inclusive design', 'WCAG', 'web design']::text[]),
  ('The Scrum Guide', 'The official guide to the Scrum framework, including accountabilities, events, artifacts, and commitments.', 'https://scrumguides.org/scrum-guide.html', 'Scrum Guides', 'guide', 30, 'Product & Agile Leadership', array['Scrum', 'agile', 'product', 'team leadership']::text[]),
  ('Atlassian Agile Coach', 'Practical explainers and guides for agile ways of working, Scrum, Kanban, and product delivery.', 'https://www.atlassian.com/agile', 'Atlassian', 'guide', 30, 'Product & Agile Leadership', array['agile', 'Scrum', 'Kanban', 'product management']::text[]),
  ('Playwright getting started', 'Get started writing end-to-end browser tests with Playwright across Chromium, Firefox, and WebKit.', 'https://playwright.dev/docs/intro', 'Playwright', 'tutorial', 30, 'QA & Reliability', array['Playwright', 'test automation', 'end-to-end testing', 'quality']::text[]),
  ('React Testing Library', 'Learn user-centered testing patterns for React interfaces and accessible interaction behavior.', 'https://testing-library.com/docs/react-testing-library/intro/', 'Testing Library', 'documentation', 30, 'QA & Reliability', array['React', 'testing', 'accessibility', 'quality assurance']::text[]),
  ('Ethereum developer documentation', 'Explore Ethereum concepts, smart contracts, development tooling, and decentralized application building.', 'https://ethereum.org/en/developers/docs/', 'Ethereum.org', 'documentation', 30, 'FinTech & Web3', array['Ethereum', 'blockchain', 'smart contracts', 'Web3']::text[]),
  ('Stripe documentation', 'Official integration guides and API references for building payment and financial product experiences.', 'https://docs.stripe.com/', 'Stripe', 'documentation', 30, 'FinTech & Web3', array['payments', 'APIs', 'fintech', 'integration']::text[]),
  ('Arduino documentation', 'Documentation and project guides for programming microcontrollers and building connected devices.', 'https://docs.arduino.cc/', 'Arduino', 'documentation', 30, 'Hardware & Robotics', array['Arduino', 'electronics', 'embedded systems', 'IoT']::text[]),
  ('Raspberry Pi projects', 'Guided projects for learning computing, electronics, physical programming, and connected devices.', 'https://projects.raspberrypi.org/en/', 'Raspberry Pi Foundation', 'project tutorials', 30, 'Hardware & Robotics', array['Raspberry Pi', 'Python', 'electronics', 'robotics']::text[]),
  ('Microsoft Power Platform training', 'Role-based learning paths for building business applications, automations, and data solutions.', 'https://learn.microsoft.com/en-us/training/powerplatform/', 'Microsoft Learn', 'learning paths', 30, 'Enterprise & Applied Tech', array['Power Platform', 'Power Apps', 'automation', 'enterprise']::text[]),
  ('Salesforce Trailhead', 'Guided, hands-on learning modules for Salesforce administration, development, data, and business workflows.', 'https://trailhead.salesforce.com/', 'Salesforce', 'learning platform', 30, 'Enterprise & Applied Tech', array['Salesforce', 'CRM', 'enterprise', 'business applications']::text[])
) as seed(title, description, url, provider, resource_type, est_minutes, category, tags)
where not exists (
  select 1 from public.resources existing where existing.url = seed.url
);
