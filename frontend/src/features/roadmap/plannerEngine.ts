import type { Milestone, Task, TaskActionType } from '../../types';
import { getOrCreateCareerBlueprint } from './careerCatalog';

export interface PlanCalculationResult {
  totalEffortHours: number;
  totalDays: number;
  totalWeeks: number;
  isOverloaded: boolean;
  requiredDailyMinutes: number;
  milestones: Milestone[];
}

export interface WeeklyCurriculumItem {
  title: string;
  skills: string[];
  tasks: Array<{
    title: string;
    type: TaskActionType;
    estMinutes?: number;
  }>;
}

/**
 * 24-Week Master Curriculum for UI/UX & Product Design
 */
const UI_UX_24_WEEKS: WeeklyCurriculumItem[] = [
  {
    title: 'UNDERSTAND UI vs UX · Research & Core Foundations',
    skills: ['UI vs UX', 'User Research', 'Wireframing', 'Design Systems'],
    tasks: [
      { title: 'Deconstruct differences between UX (research, journeys, wireframing) and UI (visuals, typography, layouts)', type: 'Learn', estMinutes: 60 },
      { title: 'Conduct 3 user empathy interviews & map end-to-end user journey flows in FigJam', type: 'Build', estMinutes: 75 },
      { title: 'Establish 8pt layout grid, button hierarchy states, and design system foundations', type: 'Practice', estMinutes: 45 },
      { title: 'Week 1 Checkpoint: Publish verified UI vs UX case teardown & starter component specs', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'LEARN ESSENTIAL TOOLS · Figma, Adobe XD & Canva',
    skills: ['Figma 2024', 'Adobe XD', 'Canva', 'Design Tokens', 'Auto-Layout'],
    tasks: [
      { title: 'Master Figma workspace: nested auto-layout, boolean vectors, variables, and styles', type: 'Learn', estMinutes: 60 },
      { title: 'Build responsive button, input, and card component libraries with multi-state variants', type: 'Build', estMinutes: 75 },
      { title: 'Recreate high-conversion mobile UI screens in Adobe XD & Canva for cross-tool fluency', type: 'Practice', estMinutes: 45 },
      { title: 'Week 2 Checkpoint: Publish verified multi-platform component library in Figma', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'MASTER CORE SKILLS · Wireframing, Prototyping & Visuals',
    skills: ['Wireframing', 'Prototyping', 'Typography', 'Color Theory', 'Responsive Design', 'User Research'],
    tasks: [
      { title: 'Establish 8-step modular typography scale & WCAG 2.2 AA compliant color palette (4.5:1)', type: 'Learn', estMinutes: 60 },
      { title: 'Construct 8 high-clarity responsive grayscale wireframes with fluid mobile constraints', type: 'Build', estMinutes: 90 },
      { title: 'Connect interactive Smart Animate micro-interactions, modal dialogs, and drawer transitions', type: 'Practice', estMinutes: 60 },
      { title: 'Week 3 Checkpoint: Run peer usability testing on clickable prototype and synthesize notes', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'BUILD REAL PROJECTS · E-Commerce, Food Delivery & Dashboard',
    skills: ['E-Commerce App', 'Food Delivery UI', 'Dashboard Design', 'Portfolio Website'],
    tasks: [
      { title: 'Analyze checkout conversion funnels and mobile friction points for e-commerce apps', type: 'Learn', estMinutes: 60 },
      { title: 'Design complete Food Delivery mobile UI with search, cart, and live driver tracking', type: 'Build', estMinutes: 90 },
      { title: 'Build data-dense SaaS analytics dashboard with interactive charts and dark mode', type: 'Practice', estMinutes: 75 },
      { title: 'Week 4 Checkpoint: Package capstone projects into structured design case study decks', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'LEARN INDUSTRY WORKFLOW · Process, Handoff & Dev Collaboration',
    skills: ['Design Process', 'User Feedback', 'Design Handoff', 'Dev Collaboration', 'HTML & CSS Basics'],
    tasks: [
      { title: 'Inspect HTML5 semantic layout models, CSS flexbox/grid, and responsive media queries', type: 'Learn', estMinutes: 60 },
      { title: 'Prepare production-ready Figma Dev Mode handoff with token specs, redlines, and assets', type: 'Build', estMinutes: 75 },
      { title: 'Simulate engineering sprint critique: synthesize developer feedback and resolve edge cases', type: 'Practice', estMinutes: 45 },
      { title: 'Week 5 Checkpoint: Conduct live design-to-code alignment walkthrough with technical documentation', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'BECOME JOB READY · Practice Daily, Portfolio & Network',
    skills: ['Practice Daily', 'Build Portfolio', 'Take Internships', 'Network Online', 'Apply Consistently'],
    tasks: [
      { title: 'Complete daily UI challenge: rapid design problem-solving under 45-minute timed sprint', type: 'Practice', estMinutes: 45 },
      { title: 'Deploy live responsive personal design portfolio on custom domain showcasing top 3 projects', type: 'Build', estMinutes: 90 },
      { title: 'Participate in design communities, connect with 10 design leads on LinkedIn & secure internship calls', type: 'Learn', estMinutes: 60 },
      { title: 'Week 6 Checkpoint: Submit 15 tailored junior/mid product designer applications with customized decks', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Micro-Interactions, Component States & Smart Animate',
    skills: ['Figma Prototyping', 'Micro-interactions', 'Smart Animate', 'Gestures'],
    tasks: [
      { title: 'Animate interactive button states (default, hover, pressed, loading, disabled)', type: 'Learn', estMinutes: 60 },
      { title: 'Build interactive accordion, modal dialog and drawer transitions in Figma', type: 'Build', estMinutes: 90 },
      { title: 'Prototype fluid drag-and-drop / swipe-to-delete mobile gestures', type: 'Practice', estMinutes: 45 },
      { title: 'Week 7 Checkpoint: Demonstrate realistic micro-interaction prototype', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Production Design System & Comprehensive UI Kit',
    skills: ['Design Systems', 'Atomic Design', 'Component Architecture', 'Tokens'],
    tasks: [
      { title: 'Build atomic components: badges, tags, avatars, tooltips & breadcrumbs', type: 'Learn', estMinutes: 60 },
      { title: 'Design complex molecular components: data tables, search bars & cards', type: 'Build', estMinutes: 90 },
      { title: 'Write component usage rules, anatomy diagrams and dos/don’ts guidelines', type: 'Practice', estMinutes: 60 },
      { title: 'Week 8 Checkpoint: Publish versioned Design System v1.0', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Mobile App Project: Onboarding & KYC Identity Flow',
    skills: ['Mobile UI', 'Fintech UX', 'Onboarding Flow', 'User Friction'],
    tasks: [
      { title: 'Benchmark top 5 mobile apps for high-converting user onboarding patterns', type: 'Learn', estMinutes: 60 },
      { title: 'Design step-by-step mobile signup, phone verification & KYC document upload', type: 'Build', estMinutes: 90 },
      { title: 'Optimize form progress indicators to reduce user drop-off friction', type: 'Practice', estMinutes: 45 },
      { title: 'Week 9 Checkpoint: Review mobile onboarding flows with peers', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Mobile App Project: High-Fidelity Prototype & Polish',
    skills: ['Interactive Prototype', 'Visual Polish', 'Mobile Guidelines', 'iOS & Android'],
    tasks: [
      { title: 'Apply iOS Human Interface Guidelines & Material 3 touch targets (48x48px)', type: 'Learn', estMinutes: 60 },
      { title: 'Complete 12 high-fidelity mobile screens for core banking transaction flows', type: 'Build', estMinutes: 90 },
      { title: 'Connect all tap interactions into a seamless mobile presentation prototype', type: 'Practice', estMinutes: 60 },
      { title: 'Week 10 Checkpoint: Run device mirror test on physical phone', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Usability Testing, Heatmaps & Iterative Refinement',
    skills: ['Usability Testing', 'Maze', 'Heatmaps', 'Design Iteration'],
    tasks: [
      { title: 'Formulate 5 scenario-based usability tasks and recruit 5 test users', type: 'Learn', estMinutes: 60 },
      { title: 'Record testing sessions via Maze or Figma, tracking time-to-task and error rates', type: 'Build', estMinutes: 90 },
      { title: 'Iterate wireframes to fix top 3 usability blockers discovered during testing', type: 'Practice', estMinutes: 60 },
      { title: 'Week 11 Checkpoint: Document usability metrics before-and-after comparison', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Developer Handoff, Token Specs & Redline Documentation',
    skills: ['Developer Handoff', 'Redlines', 'CSS Specs', 'Design-to-Code'],
    tasks: [
      { title: 'Annotate padding, constraints, responsive auto-layout rules and layout grids', type: 'Learn', estMinutes: 60 },
      { title: 'Export design token JSON schema compatible with Tailwind CSS & Style Dictionary', type: 'Build', estMinutes: 75 },
      { title: 'Host mock developer handoff walkthrough to align on edge cases & states', type: 'Practice', estMinutes: 60 },
      { title: 'Week 12 Checkpoint: Approve production-ready handoff file', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'SaaS Web App: Complex Analytics Dashboard Architecture',
    skills: ['SaaS UX', 'Analytics Dashboard', 'Data Density', 'Grid Layouts'],
    tasks: [
      { title: 'Research B2B analytics workflows and key metric visualization requirements', type: 'Learn', estMinutes: 60 },
      { title: 'Design modular 12-column widget grid layout with collapsible side navigation', type: 'Build', estMinutes: 90 },
      { title: 'Implement date range pickers, multi-select filters and export action bars', type: 'Practice', estMinutes: 60 },
      { title: 'Week 13 Checkpoint: Validate layout density across laptop & wide screens', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'SaaS Web App: Data Visualization, Charts & Responsive Breakpoints',
    skills: ['Data Visualization', 'Chart Design', 'Responsive UI', 'Tables'],
    tasks: [
      { title: 'Design accessible line charts, bar graphs and donut charts with hover tooltips', type: 'Learn', estMinutes: 60 },
      { title: 'Construct enterprise data table with sortable headers, pagination & inline edits', type: 'Build', estMinutes: 90 },
      { title: 'Adapt dashboard layout for tablet and mobile portrait responsive views', type: 'Practice', estMinutes: 60 },
      { title: 'Week 14 Checkpoint: Test interactive dashboard prototype across 3 screen sizes', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Frontend Feasibility: HTML5 Semantics & CSS Flex/Grid Constraints',
    skills: ['HTML5', 'CSS Flexbox', 'CSS Grid', 'Dev Collaboration'],
    tasks: [
      { title: 'Review HTML5 semantic landmark elements (<main>, <aside>, <section>, <nav>)', type: 'Learn', estMinutes: 60 },
      { title: 'Code a working HTML/CSS responsive card component matching your Figma design', type: 'Build', estMinutes: 90 },
      { title: 'Test flex-wrap, grid-template-columns and clamp() fluid typography in browser', type: 'Practice', estMinutes: 60 },
      { title: 'Week 15 Checkpoint: Verify 1:1 fidelity between Figma spec and live CSS', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Portfolio Website: Narrative Architecture & Copywriting',
    skills: ['Portfolio Design', 'UX Writing', 'Personal Branding', 'Case Studies'],
    tasks: [
      { title: 'Outline portfolio structure: Hero intro, Featured Projects, About & Contact', type: 'Learn', estMinutes: 60 },
      { title: 'Draft compelling story-driven case study outlines highlighting business impact', type: 'Build', estMinutes: 90 },
      { title: 'Write clear hero tagline communicating your unique design specialization', type: 'Practice', estMinutes: 45 },
      { title: 'Week 16 Checkpoint: Finalize all portfolio copywriting and project assets', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Portfolio Website: Visual Craft & No-Code / Code Deployment',
    skills: ['Framer / Webflow', 'Live Deployment', 'Custom Domain', 'Responsive Web'],
    tasks: [
      { title: 'Design bespoke portfolio visual layout with dark/light themes and custom cursor', type: 'Learn', estMinutes: 60 },
      { title: 'Build and publish live portfolio website on Framer or custom React deployment', type: 'Build', estMinutes: 105 },
      { title: 'Test mobile responsiveness, fast image loading and touch gesture smooth scroll', type: 'Practice', estMinutes: 45 },
      { title: 'Week 17 Checkpoint: Launch live portfolio on custom domain', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'In-Depth Case Study 1: Mobile Fintech UX & Conversion',
    skills: ['Case Study Writing', 'Design Process', 'Metrics & Impact', 'Storytelling'],
    tasks: [
      { title: 'Structure case study with Problem, Discovery, Wireframes, Testing & Metrics', type: 'Learn', estMinutes: 60 },
      { title: 'Create high-resolution 3D perspective device mockups and animated GIFs', type: 'Build', estMinutes: 90 },
      { title: 'Quantify design impact (e.g. +34% completion rate, -50% onboarding time)', type: 'Practice', estMinutes: 60 },
      { title: 'Week 18 Checkpoint: Publish Case Study 1 to live portfolio', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'In-Depth Case Study 2: SaaS Analytics Dashboard Redesign',
    skills: ['B2B Case Study', 'Information Architecture', 'Usability Metrics', 'Before/After'],
    tasks: [
      { title: 'Draft before-and-after heuristic evaluation diagrams showing cognitive load reduction', type: 'Learn', estMinutes: 60 },
      { title: 'Generate interactive prototype walkthrough video with voiceover commentary', type: 'Build', estMinutes: 90 },
      { title: 'Highlight design system reuse and engineering velocity improvements', type: 'Practice', estMinutes: 60 },
      { title: 'Week 19 Checkpoint: Publish Case Study 2 to portfolio and Medium', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Dribbble & Behance Visual Presentations & Media Assets',
    skills: ['Dribbble', 'Behance', 'Visual Presentation', 'Social Proof'],
    tasks: [
      { title: 'Create 4 curated Dribbble shot carousels with claymorphism & dark aesthetic', type: 'Learn', estMinutes: 60 },
      { title: 'Format comprehensive Behance presentation with project branding & credits', type: 'Build', estMinutes: 90 },
      { title: 'Engage with design community feedback and share case study insights', type: 'Practice', estMinutes: 45 },
      { title: 'Week 20 Checkpoint: Reach 100+ public impressions on featured shots', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Design System Community Kit & Open-Source Figma File',
    skills: ['Open Source Design', 'Figma Community', 'Component Docs', 'Reputation'],
    tasks: [
      { title: 'Clean up Figma layers, naming conventions and component auto-layout constraints', type: 'Learn', estMinutes: 60 },
      { title: 'Write starter guide and changelog documentation for external designers', type: 'Build', estMinutes: 75 },
      { title: 'Publish free UI Kit to Figma Community to showcase technical mastery', type: 'Practice', estMinutes: 45 },
      { title: 'Week 21 Checkpoint: Obtain first 50 duplicate downloads on Figma Community', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Whiteboard Design Challenges & App Critique Interview Drills',
    skills: ['Whiteboard Challenge', 'Interview Prep', 'Design Critique', 'Live Problem Solving'],
    tasks: [
      { title: 'Practice 3 timed 45-minute whiteboard prompts (e.g. Design ATM for Children)', type: 'Learn', estMinutes: 60 },
      { title: 'Structure response framework: 5Ws, user personas, trade-offs & MVP wireframe', type: 'Build', estMinutes: 90 },
      { title: 'Conduct live app critique on a popular tech product (Spotify/Linear/Airbnb)', type: 'Practice', estMinutes: 60 },
      { title: 'Week 22 Checkpoint: Pass mock design whiteboard simulation with mentor', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Resume & LinkedIn ATS Polish with Case Study Metrics',
    skills: ['Resume Polish', 'ATS Optimization', 'LinkedIn Profile', 'Networking'],
    tasks: [
      { title: 'Rewrite resume bullets using Action + Context + Quantifiable Metric format', type: 'Learn', estMinutes: 60 },
      { title: 'Optimize LinkedIn profile headline, featured section & case study links', type: 'Build', estMinutes: 75 },
      { title: 'Identify top 30 target companies actively hiring UI/UX & Product Designers', type: 'Practice', estMinutes: 60 },
      { title: 'Week 23 Checkpoint: Pass 90+ ATS score on resume scanner', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Job-Ready Launch: 20+ Targeted Applications & Outreach',
    skills: ['Job Applications', 'Cold Outreach', 'Referral Networking', 'Interview Sprint'],
    tasks: [
      { title: 'Submit 20 tailored applications with personalized portfolio teaser links', type: 'Learn', estMinutes: 60 },
      { title: 'Send 10 thoughtful LinkedIn messages to design leads and engineering managers', type: 'Build', estMinutes: 90 },
      { title: 'Prepare answers for top 10 behavioral & design philosophy interview questions', type: 'Practice', estMinutes: 60 },
      { title: 'Week 24 Checkpoint: Complete final mock interview and secure initial screenings', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
];

/**
 * 24-Week Master Curriculum for Software & Web (Full Stack / Frontend / Backend)
 */
const SOFTWARE_WEB_24_WEEKS: WeeklyCurriculumItem[] = [
  {
    title: 'Strict Production Dev Environment, TypeScript 5 & Toolchain',
    skills: ['TypeScript 5', 'ESLint / Biome', 'Git Hooks', 'Vite / Next.js'],
    tasks: [
      { title: 'Configure TypeScript strict mode, path aliases & modern build toolchain', type: 'Learn', estMinutes: 60 },
      { title: 'Set up Husky pre-commit hooks, linting rules & automated formatters', type: 'Build', estMinutes: 75 },
      { title: 'Implement type-safe utility library with generics and brand types', type: 'Practice', estMinutes: 60 },
      { title: 'Week 1 Checkpoint: Pass zero-warning automated build & lint check', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'JavaScript / Node Runtime Internals, Async Loop & Memory Profiling',
    skills: ['Node.js Internals', 'Event Loop', 'Promises', 'Memory Profiling'],
    tasks: [
      { title: 'Analyze microtask vs macrotask execution order in V8 engine', type: 'Learn', estMinutes: 60 },
      { title: 'Build high-concurrency async batch worker pool with rate limiting', type: 'Build', estMinutes: 90 },
      { title: 'Profile memory leaks and heap allocations using Chrome DevTools', type: 'Practice', estMinutes: 60 },
      { title: 'Week 2 Checkpoint: Pass 1,000 req/sec benchmark with zero memory leak', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'React 19 Core Architecture, Server Components & Suspense',
    skills: ['React 19', 'RSC', 'Server Actions', 'Suspense'],
    tasks: [
      { title: 'Master Server vs Client Component boundaries and data serialization', type: 'Learn', estMinutes: 60 },
      { title: 'Build async Server Action mutation flow with useOptimistic UI updates', type: 'Build', estMinutes: 90 },
      { title: 'Implement streaming UI skeletons with nested Suspense boundaries', type: 'Practice', estMinutes: 60 },
      { title: 'Week 3 Checkpoint: Deploy streaming React 19 app with sub-100ms FCP', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Advanced State Management, Cache Invalidation & Data Flow',
    skills: ['TanStack Query', 'Zustand', 'Cache Invalidation', 'Optimistic UI'],
    tasks: [
      { title: 'Design normalized client store architecture with Zustand slices', type: 'Learn', estMinutes: 60 },
      { title: 'Configure TanStack Query cache invalidation, stale-while-revalidate & retries', type: 'Build', estMinutes: 90 },
      { title: 'Implement multi-tab broadcast channel sync for state consistency', type: 'Practice', estMinutes: 60 },
      { title: 'Week 4 Checkpoint: Test offline cache persistence and automatic sync', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Accessible Component Systems, Tailwind & Responsive Layouts',
    skills: ['Tailwind CSS', 'Radix UI', 'ARIA', 'Responsive Design'],
    tasks: [
      { title: 'Audit keyboard navigation, focus trap and ARIA attributes on modals', type: 'Learn', estMinutes: 60 },
      { title: 'Build accessible command menu (Cmd+K) with Radix UI and Tailwind CSS', type: 'Build', estMinutes: 90 },
      { title: 'Stress test layouts on ultra-wide desktop and mobile touch devices', type: 'Practice', estMinutes: 60 },
      { title: 'Week 5 Checkpoint: Pass automated Axe accessibility audit with 100%', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'REST & RPC API Architecture, Schema Validation with Zod',
    skills: ['REST APIs', 'Zod Validation', 'Error Handling', 'HTTP RFCs'],
    tasks: [
      { title: 'Design RESTful endpoint conventions following RFC 7807 problem details', type: 'Learn', estMinutes: 60 },
      { title: 'Implement runtime schema validation with Zod middleware on all endpoints', type: 'Build', estMinutes: 90 },
      { title: 'Build structured error handling with custom domain exception classes', type: 'Practice', estMinutes: 60 },
      { title: 'Week 6 Checkpoint: Verify OpenAPI / Swagger interactive documentation', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'PostgreSQL Relational Schema Design, Normalization & Indexing',
    skills: ['PostgreSQL', 'SQL Optimization', 'Indexing', 'Transactions'],
    tasks: [
      { title: 'Design 3NF relational database schema with foreign keys and cascade rules', type: 'Learn', estMinutes: 60 },
      { title: 'Write migration scripts, composite indexes & benchmark EXPLAIN ANALYZE', type: 'Build', estMinutes: 90 },
      { title: 'Implement ACID transactions with optimistic locking on concurrent updates', type: 'Practice', estMinutes: 60 },
      { title: 'Week 7 Checkpoint: Demonstrate sub-5ms query performance on 100k rows', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Supabase Backend: Row Level Security (RLS) & Multi-Tenant Isolation',
    skills: ['Supabase', 'RLS Policies', 'Multi-tenant', 'Security'],
    tasks: [
      { title: 'Configure tenant-isolated RLS policies on tables using auth.uid()', type: 'Learn', estMinutes: 60 },
      { title: 'Build automated database trigger functions for audit logs and updated_at', type: 'Build', estMinutes: 90 },
      { title: 'Perform security penetration check attempting cross-tenant record leakage', type: 'Practice', estMinutes: 60 },
      { title: 'Week 8 Checkpoint: Verify zero unauthorized data leakage with RLS tests', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Secure Authentication: JWT Tokens, Refresh Rotation & OAuth2',
    skills: ['JWT Auth', 'OAuth2', 'Cookie Security', 'Token Rotation'],
    tasks: [
      { title: 'Implement HttpOnly secure cookie storage with CSRF protection headers', type: 'Learn', estMinutes: 60 },
      { title: 'Build refresh token rotation mechanism with automatic revocation on reuse', type: 'Build', estMinutes: 90 },
      { title: 'Integrate Google & GitHub social OAuth2 flow with account linking', type: 'Practice', estMinutes: 60 },
      { title: 'Week 9 Checkpoint: Test seamless silent session refresh across reloads', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Real-Time Communication: WebSockets, Presence & Event Broadcasting',
    skills: ['WebSockets', 'Realtime Sync', 'Presence', 'Pub/Sub'],
    tasks: [
      { title: 'Establish WebSocket channel with heartbeat keepalive and auto-reconnect', type: 'Learn', estMinutes: 60 },
      { title: 'Build live presence tracker showing active online team collaborators', type: 'Build', estMinutes: 90 },
      { title: 'Implement broadcast pub/sub event pipeline with optimistic UI rendering', type: 'Practice', estMinutes: 60 },
      { title: 'Week 10 Checkpoint: Demonstrate multi-browser real-time data sync', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Edge Functions, Background Queues & Asynchronous Workers',
    skills: ['Serverless', 'Edge Functions', 'BullMQ', 'Redis'],
    tasks: [
      { title: 'Deploy low-latency TypeScript Edge Function with streaming response', type: 'Learn', estMinutes: 60 },
      { title: 'Set up Redis message queue with retry exponential backoff policies', type: 'Build', estMinutes: 90 },
      { title: 'Process PDF document generation and email dispatch asynchronously', type: 'Practice', estMinutes: 60 },
      { title: 'Week 11 Checkpoint: Benchmark async queue processing throughput', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Automated Unit & Integration Testing Suite (Vitest & MSW)',
    skills: ['Vitest', 'Testing Library', 'MSW', 'TDD'],
    tasks: [
      { title: 'Mock network requests with Mock Service Worker (MSW) in tests', type: 'Learn', estMinutes: 60 },
      { title: 'Write comprehensive test suite for critical domain services and reducers', type: 'Build', estMinutes: 90 },
      { title: 'Achieve 85%+ branch coverage on all core application logic', type: 'Practice', estMinutes: 60 },
      { title: 'Week 12 Checkpoint: Pass automated test suite in under 15 seconds', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'End-to-End Automated Browser Testing with Playwright',
    skills: ['Playwright', 'E2E Testing', 'CI Test Runners', 'Cross-browser'],
    tasks: [
      { title: 'Configure Playwright test runner across Chromium, Firefox and WebKit', type: 'Learn', estMinutes: 60 },
      { title: 'Write robust E2E test covering Signup -> Onboarding -> Checkout journey', type: 'Build', estMinutes: 90 },
      { title: 'Capture video recordings, screenshots and network traces on test failure', type: 'Practice', estMinutes: 60 },
      { title: 'Week 13 Checkpoint: Run headless E2E suite in GitHub Actions pipeline', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Capstone SaaS Project: Multi-Tenant Architecture & Data Model',
    skills: ['SaaS Architecture', 'Multi-tenancy', 'Data Seeding', 'Domain Modeling'],
    tasks: [
      { title: 'Scaffold enterprise SaaS codebase with modular domain architecture', type: 'Learn', estMinutes: 60 },
      { title: 'Implement organization workspaces, team invitations and role permissions', type: 'Build', estMinutes: 105 },
      { title: 'Seed realistic demonstration data with 100+ entities for testing', type: 'Practice', estMinutes: 60 },
      { title: 'Week 14 Checkpoint: Verify workspace isolation and member roles', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Capstone SaaS Project: Stripe Subscriptions & Webhook Security',
    skills: ['Stripe Payments', 'Webhooks', 'Subscription Billing', 'Idempotency'],
    tasks: [
      { title: 'Integrate Stripe Checkout and Customer Portal for tiered SaaS plans', type: 'Learn', estMinutes: 60 },
      { title: 'Build idempotent webhook listener with signature verification and retry logic', type: 'Build', estMinutes: 105 },
      { title: 'Handle subscription upgrades, downgrades, cancellations & past-due grace', type: 'Practice', estMinutes: 60 },
      { title: 'Week 15 Checkpoint: Pass end-to-end payment test with Stripe CLI', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Performance Optimization: Bundle Splitting, Latency & Web Vitals',
    skills: ['Web Vitals', 'Code Splitting', 'Lighthouse 100', 'Bundle Analysis'],
    tasks: [
      { title: 'Analyze production JavaScript bundle using Rollup Visualizer', type: 'Learn', estMinutes: 60 },
      { title: 'Implement dynamic import() code splitting for heavy modals and charts', type: 'Build', estMinutes: 90 },
      { title: 'Optimize Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS)', type: 'Practice', estMinutes: 60 },
      { title: 'Week 16 Checkpoint: Achieve 95+ score on Google Lighthouse performance', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Docker Containerization & Multi-Stage Production Builds',
    skills: ['Docker', 'Multi-stage Builds', 'Container Security', 'Minimal Images'],
    tasks: [
      { title: 'Write optimized multi-stage Dockerfile using Alpine Linux minimal base', type: 'Learn', estMinutes: 60 },
      { title: 'Configure docker-compose with local database, cache and service networks', type: 'Build', estMinutes: 90 },
      { title: 'Scan container image for vulnerabilities using Trivy or Docker Scout', type: 'Practice', estMinutes: 60 },
      { title: 'Week 17 Checkpoint: Verify production container builds under 80MB', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'CI/CD Pipeline Automation with GitHub Actions & Automated Testing',
    skills: ['GitHub Actions', 'CI/CD', 'Automated Deployments', 'Secrets'],
    tasks: [
      { title: 'Configure GitHub Actions workflow for linting, type-checking and unit tests', type: 'Learn', estMinutes: 60 },
      { title: 'Automate zero-downtime deployment to production on main branch merge', type: 'Build', estMinutes: 90 },
      { title: 'Implement automatic preview deployments for pull request reviews', type: 'Practice', estMinutes: 60 },
      { title: 'Week 18 Checkpoint: Trigger successful end-to-end automated pipeline', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Cloud Deployment, SSL Certificates & Custom Domain Routing',
    skills: ['Cloud Hosting', 'DNS Management', 'SSL / TLS', 'Edge CDN'],
    tasks: [
      { title: 'Configure DNS records (A, CNAME) and provision automated SSL certs', type: 'Learn', estMinutes: 60 },
      { title: 'Deploy production frontend and backend services to cloud provider', type: 'Build', estMinutes: 90 },
      { title: 'Configure HTTP security headers (CSP, HSTS, X-Frame-Options)', type: 'Practice', estMinutes: 60 },
      { title: 'Week 19 Checkpoint: Verify live production app over HTTPS custom domain', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Production Observability: Sentry Error Monitoring & Telemetry',
    skills: ['Sentry', 'Logging', 'APM', 'Distributed Tracing'],
    tasks: [
      { title: 'Integrate Sentry error tracking with source maps and user context', type: 'Learn', estMinutes: 60 },
      { title: 'Set up structured JSON logging with request correlation IDs', type: 'Build', estMinutes: 90 },
      { title: 'Configure Slack alert webhooks for unhandled 5xx server exceptions', type: 'Practice', estMinutes: 60 },
      { title: 'Week 20 Checkpoint: Trigger test error and inspect full telemetry trace', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'System Design: Scalability, Caching & Load Balancing Architecture',
    skills: ['System Design', 'Scalability', 'CDN Caching', 'Microservices'],
    tasks: [
      { title: 'Study horizontal scaling, load balancers and database read-replicas', type: 'Learn', estMinutes: 60 },
      { title: 'Draft system architecture diagram for 100k concurrent active users', type: 'Build', estMinutes: 90 },
      { title: 'Design distributed caching strategy with Redis cache-aside pattern', type: 'Practice', estMinutes: 60 },
      { title: 'Week 21 Checkpoint: Present complete system design spec to peers', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Data Structures, Algorithms & Technical Whiteboard Interview Drills',
    skills: ['Algorithms', 'Data Structures', 'LeetCode', 'Interview Drills'],
    tasks: [
      { title: 'Review hash maps, two pointers, sliding window and binary search patterns', type: 'Learn', estMinutes: 60 },
      { title: 'Solve 15 medium-difficulty coding challenges on LeetCode/NeetCode', type: 'Build', estMinutes: 90 },
      { title: 'Practice live verbal problem-solving and space-time complexity analysis', type: 'Practice', estMinutes: 60 },
      { title: 'Week 22 Checkpoint: Pass mock technical coding interview simulation', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Portfolio Case Study Polish, GitHub README & ATS Resume',
    skills: ['Portfolio Showcase', 'GitHub Polish', 'ATS Resume', 'LinkedIn'],
    tasks: [
      { title: 'Write comprehensive technical README with architecture diagrams and API docs', type: 'Learn', estMinutes: 60 },
      { title: 'Produce 90-second Loom video walk-through demonstrating live capstone app', type: 'Build', estMinutes: 90 },
      { title: 'Tailor resume bullets with quantifiable engineering impact metrics', type: 'Practice', estMinutes: 60 },
      { title: 'Week 23 Checkpoint: Publish open-source capstone repository with live demo', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
  {
    title: 'Job-Ready Launch: 25+ Targeted Applications & Referral Outreach',
    skills: ['Job Outreach', 'Networking', 'Salary Negotiation', 'Behavioral Interviews'],
    tasks: [
      { title: 'Submit 25 customized applications to high-growth engineering teams', type: 'Learn', estMinutes: 60 },
      { title: 'Reach out to 15 engineering managers and alumni for warm referrals', type: 'Build', estMinutes: 90 },
      { title: 'Rehearse STAR behavioral interview responses for leadership questions', type: 'Practice', estMinutes: 60 },
      { title: 'Week 24 Checkpoint: Complete first round screenings and secure interviews', type: 'Checkpoint', estMinutes: 60 },
    ],
  },
];

/**
 * Universal Fallback 24-Week Curriculum Generator for Any Career Role
 */
function generateDynamic24Weeks(roleTitle: string, skills: string[]): WeeklyCurriculumItem[] {
  const s0 = skills[0] || 'Core Syntax';
  const s1 = skills[1] || 'Domain Architecture';
  const s2 = skills[2] || 'Advanced Systems';
  const s3 = skills[3] || 'Production Deployment';

  return [
    // Phase 1: Environment & Primitives
    {
      title: `Production Environment Setup & Core Toolchain for ${roleTitle}`,
      skills: [s0, 'Tooling', 'Dev Environment'],
      tasks: [
        { title: `Configure strict linter, dev tools and environment for ${s0}`, type: 'Learn', estMinutes: 60 },
        { title: `Set up version control, git workflow and baseline project templates`, type: 'Build', estMinutes: 75 },
        { title: `Validate local development sandbox and run initial smoke tests`, type: 'Practice', estMinutes: 45 },
        { title: `Week 1 Checkpoint: Verify automated dev environment builds cleanly`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Fundamental Principles, Syntax & Domain Foundations for ${s0}`,
      skills: [s0, 'Syntax', 'Best Practices'],
      tasks: [
        { title: `Study core syntax, idiomatic patterns and language primitives of ${s0}`, type: 'Learn', estMinutes: 60 },
        { title: `Implement 5 practical domain algorithmic problems and exercises`, type: 'Build', estMinutes: 75 },
        { title: `Refactor code for clean architecture, readability and maintainability`, type: 'Practice', estMinutes: 45 },
        { title: `Week 2 Checkpoint: Pass automated syntax and unit test verification`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Essential Libraries, Frameworks & Tooling Ecosystem`,
      skills: [s0, s1, 'Ecosystem'],
      tasks: [
        { title: `Research top industry-standard packages and architectural frameworks`, type: 'Learn', estMinutes: 60 },
        { title: `Integrate core dependencies and scaffold modular application structure`, type: 'Build', estMinutes: 75 },
        { title: `Benchmark package performance, bundle size and license compliance`, type: 'Practice', estMinutes: 45 },
        { title: `Week 3 Checkpoint: Lock project dependencies and build clean baseline`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `State Management, Data Flow & Component Architecture`,
      skills: [s1, 'State Flow', 'Architecture'],
      tasks: [
        { title: `Design clean unidirectional data flow and state synchronization`, type: 'Learn', estMinutes: 60 },
        { title: `Build reusable modular abstractions and service layer interfaces`, type: 'Build', estMinutes: 90 },
        { title: `Stress test state updates under high frequency user interactions`, type: 'Practice', estMinutes: 45 },
        { title: `Week 4 Checkpoint: Test state transitions with automated assertions`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Error Handling, Edge Cases & Data Validation Rules`,
      skills: [s1, 'Validation', 'Resilience'],
      tasks: [
        { title: `Implement strict schema validation on all inputs and data payloads`, type: 'Learn', estMinutes: 60 },
        { title: `Construct resilient error boundaries and recovery fallback mechanisms`, type: 'Build', estMinutes: 75 },
        { title: `Write negative test cases covering edge-case failures and exceptions`, type: 'Practice', estMinutes: 45 },
        { title: `Week 5 Checkpoint: Pass 100% of invalid input fuzz testing cases`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Phase 1 Capstone: End-to-End Core Feature Verification`,
      skills: [s0, s1, 'Milestone Project'],
      tasks: [
        { title: `Assemble all Phase 1 components into a working feature prototype`, type: 'Learn', estMinutes: 60 },
        { title: `Write integration tests verifying data input through output cycle`, type: 'Build', estMinutes: 90 },
        { title: `Document technical architecture specifications and usage guide`, type: 'Practice', estMinutes: 60 },
        { title: `Week 6 Checkpoint: Deliver working Phase 1 functional deliverable`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },

    // Phase 2: Domain Deep-Dive & Data Modeling
    {
      title: `Data Modeling, Storage Schemas & Persistence for ${s1}`,
      skills: [s1, 'Databases', 'Persistence'],
      tasks: [
        { title: `Design normalized relational or document data schema for domain entities`, type: 'Learn', estMinutes: 60 },
        { title: `Write migration scripts and database indexing for high performance`, type: 'Build', estMinutes: 90 },
        { title: `Test concurrent write collisions and transaction rollback scenarios`, type: 'Practice', estMinutes: 60 },
        { title: `Week 7 Checkpoint: Verify sub-10ms query execution benchmarks`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Security Architecture, Access Control & Authentication`,
      skills: [s1, 'Security', 'Auth', 'Permissions'],
      tasks: [
        { title: `Configure role-based access control (RBAC) and security policies`, type: 'Learn', estMinutes: 60 },
        { title: `Implement secure session token handling and cryptographic hashes`, type: 'Build', estMinutes: 90 },
        { title: `Perform vulnerability audit against OWASP Top 10 common vectors`, type: 'Practice', estMinutes: 45 },
        { title: `Week 8 Checkpoint: Pass automated security and authorization checks`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Asynchronous Data Pipelines, Caching & Performance Tuning`,
      skills: [s2, 'Caching', 'Async Pipelines'],
      tasks: [
        { title: `Implement high-speed in-memory caching and cache invalidation rules`, type: 'Learn', estMinutes: 60 },
        { title: `Construct asynchronous background task processing pipeline`, type: 'Build', estMinutes: 90 },
        { title: `Benchmark latency before and after caching on heavy throughput endpoints`, type: 'Practice', estMinutes: 60 },
        { title: `Week 9 Checkpoint: Demonstrate 3x throughput speed improvement`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Third-Party Integrations, Webhooks & External Services`,
      skills: [s2, 'Integrations', 'Webhooks'],
      tasks: [
        { title: `Integrate external partner REST/GraphQL APIs with rate limit guards`, type: 'Learn', estMinutes: 60 },
        { title: `Build secure webhook receiver with payload signature verification`, type: 'Build', estMinutes: 90 },
        { title: `Test idempotency and automated retry backoff on third-party outages`, type: 'Practice', estMinutes: 60 },
        { title: `Week 10 Checkpoint: Verify zero dropped events during simulated outage`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Real-Time Communication & Event Streaming Architecture`,
      skills: [s2, 'Realtime', 'WebSockets', 'Events'],
      tasks: [
        { title: `Set up bidirectional WebSocket or event streaming communication`, type: 'Learn', estMinutes: 60 },
        { title: `Build live updates broadcast channel with optimistic user interface`, type: 'Build', estMinutes: 90 },
        { title: `Test network reconnection stability during intermittent dropouts`, type: 'Practice', estMinutes: 60 },
        { title: `Week 11 Checkpoint: Demonstrate smooth real-time multi-client sync`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Phase 2 Capstone: Production Backend & Full API Deployment`,
      skills: [s1, s2, 'Backend Capstone'],
      tasks: [
        { title: `Deploy complete production service with environment secrets configuration`, type: 'Learn', estMinutes: 60 },
        { title: `Write comprehensive API documentation with live interactive examples`, type: 'Build', estMinutes: 90 },
        { title: `Run end-to-end integration test suite against live deployed environment`, type: 'Practice', estMinutes: 60 },
        { title: `Week 12 Checkpoint: Pass public healthcheck and uptime monitoring`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },

    // Phase 3: Production Capstone Projects & Testing
    {
      title: `Capstone Project 1: Architecture Scaffolding & Business Logic`,
      skills: [s0, s2, 'Project Build'],
      tasks: [
        { title: `Define functional specifications and user stories for flagship capstone`, type: 'Learn', estMinutes: 60 },
        { title: `Scaffold full project architecture and implement core domain features`, type: 'Build', estMinutes: 105 },
        { title: `Seed realistic production dataset for comprehensive user testing`, type: 'Practice', estMinutes: 60 },
        { title: `Week 13 Checkpoint: Demonstrate MVP feature walkthrough to peers`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Capstone Project 1: Advanced Features, Dashboards & Exports`,
      skills: [s2, 'Feature Polish'],
      tasks: [
        { title: `Build advanced reporting dashboards, analytics and search filters`, type: 'Learn', estMinutes: 60 },
        { title: `Implement automated report generation and data export (CSV/PDF)`, type: 'Build', estMinutes: 90 },
        { title: `Polish UI/UX micro-interactions, responsive states and loading feedback`, type: 'Practice', estMinutes: 60 },
        { title: `Week 14 Checkpoint: Test end-to-end feature completion across devices`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Automated Testing Suite: Unit, Integration & Regression Coverage`,
      skills: ['Testing', 'TDD', 'Code Quality'],
      tasks: [
        { title: `Write automated unit tests for all business logic functions`, type: 'Learn', estMinutes: 60 },
        { title: `Construct integration test suite for cross-module workflows`, type: 'Build', estMinutes: 90 },
        { title: `Enforce 80%+ test coverage gate in local pre-commit hooks`, type: 'Practice', estMinutes: 60 },
        { title: `Week 15 Checkpoint: Pass all automated test suites with 0 failures`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `End-to-End User Journey Verification & Browser Automation`,
      skills: ['E2E Testing', 'Playwright', 'QA'],
      tasks: [
        { title: `Configure automated browser testing runner for critical happy paths`, type: 'Learn', estMinutes: 60 },
        { title: `Write automated script simulating real user navigation from start to finish`, type: 'Build', estMinutes: 90 },
        { title: `Record and review test run video artifacts to identify visual glitches`, type: 'Practice', estMinutes: 60 },
        { title: `Week 16 Checkpoint: Ensure E2E test runs cleanly on automated CI runner`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Performance Optimization, Latency Reduction & Profiling`,
      skills: ['Performance', 'Optimization', 'Profiling'],
      tasks: [
        { title: `Profile memory usage, bundle sizes and CPU hot spots under load`, type: 'Learn', estMinutes: 60 },
        { title: `Apply code splitting, lazy loading and algorithm optimizations`, type: 'Build', estMinutes: 90 },
        { title: `Run load testing simulation with 100 concurrent virtual users`, type: 'Practice', estMinutes: 60 },
        { title: `Week 17 Checkpoint: Achieve sub-200ms p95 latency benchmarks`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Docker Containerization & Production Cloud Hosting`,
      skills: [s3, 'Docker', 'Cloud Hosting'],
      tasks: [
        { title: `Write production multi-stage Dockerfile with security best practices`, type: 'Learn', estMinutes: 60 },
        { title: `Deploy containerized project to cloud infrastructure on custom domain`, type: 'Build', estMinutes: 90 },
        { title: `Configure automatic SSL certificates and HTTP security headers`, type: 'Practice', estMinutes: 60 },
        { title: `Week 18 Checkpoint: Verify live production capstone is publicly online`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },

    // Phase 4: Industry Workflow, Portfolio & Job Readiness
    {
      title: `Capstone Project 2: High-Complexity Architecture Challenge`,
      skills: [s2, s3, 'Advanced Project'],
      tasks: [
        { title: `Scaffold secondary specialized capstone showcasing deep domain mastery`, type: 'Learn', estMinutes: 60 },
        { title: `Implement complex algorithms, distributed state or machine intelligence`, type: 'Build', estMinutes: 105 },
        { title: `Conduct peer code review and address architectural feedback`, type: 'Practice', estMinutes: 60 },
        { title: `Week 19 Checkpoint: Publish open-source repository for Project 2`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Automated CI/CD Workflows, GitHub Actions & Quality Gates`,
      skills: [s3, 'CI/CD', 'GitHub Actions', 'DevOps'],
      tasks: [
        { title: `Set up GitHub Actions pipeline for automated testing and linting on PRs`, type: 'Learn', estMinutes: 60 },
        { title: `Configure zero-downtime continuous deployment on merge to main`, type: 'Build', estMinutes: 90 },
        { title: `Implement automated preview environments for PR visual reviews`, type: 'Practice', estMinutes: 60 },
        { title: `Week 20 Checkpoint: Successfully trigger automated deploy via CI/CD`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Production Observability, Error Tracking & Logging Telemetry`,
      skills: [s3, 'Observability', 'Sentry', 'Telemetry'],
      tasks: [
        { title: `Integrate Sentry error monitoring and performance telemetry instrumentation`, type: 'Learn', estMinutes: 60 },
        { title: `Set up structured JSON logging with request correlation IDs`, type: 'Build', estMinutes: 75 },
        { title: `Configure automated alerts for unexpected 5xx application errors`, type: 'Practice', estMinutes: 45 },
        { title: `Week 21 Checkpoint: Inspect live error and telemetry tracking dashboards`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `System Design Drills & Technical Architecture Interviews`,
      skills: ['System Design', 'Scalability', 'Interview Prep'],
      tasks: [
        { title: `Study system design trade-offs: CAP theorem, caching, partitioning`, type: 'Learn', estMinutes: 60 },
        { title: `Draw complete architecture blueprint for high-scale enterprise service`, type: 'Build', estMinutes: 90 },
        { title: `Conduct timed 45-minute verbal system design simulation with peer`, type: 'Practice', estMinutes: 60 },
        { title: `Week 22 Checkpoint: Pass mock technical system design screening`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Portfolio Technical Case Studies, GitHub README & ATS Resume`,
      skills: ['Portfolio Case Studies', 'GitHub Polish', 'ATS Resume'],
      tasks: [
        { title: `Write comprehensive case study articles detailing problem, trade-offs & results`, type: 'Learn', estMinutes: 60 },
        { title: `Polish GitHub README with architecture diagrams and live demo URLs`, type: 'Build', estMinutes: 90 },
        { title: `Optimize resume bullets with quantifiable engineering impact metrics`, type: 'Practice', estMinutes: 60 },
        { title: `Week 23 Checkpoint: Pass 90+ ATS score on resume scanner`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
    {
      title: `Job-Ready Launch: 25+ Targeted Company Applications & Outreach`,
      skills: ['Job Outreach', 'Networking', 'Interview Sprints', 'Employment'],
      tasks: [
        { title: `Submit 25 customized job applications with personalized portfolio links`, type: 'Learn', estMinutes: 60 },
        { title: `Send 15 direct outreach messages to engineering managers and recruiters`, type: 'Build', estMinutes: 90 },
        { title: `Rehearse STAR behavioral interview responses for technical leadership`, type: 'Practice', estMinutes: 60 },
        { title: `Week 24 Checkpoint: Complete first-round screenings and secure interviews`, type: 'Checkpoint', estMinutes: 60 },
      ],
    },
  ];
}

/**
 * Returns an array of exactly `totalWeeks` realistic 1-week goals tailored for the chosen career.
 */
export function getWeeklyCurriculum(
  roleTitle: string,
  totalWeeks: number
): WeeklyCurriculumItem[] {
  const blueprint = getOrCreateCareerBlueprint(roleTitle);
  const isUIUX =
    roleTitle.toLowerCase().includes('ui') ||
    roleTitle.toLowerCase().includes('ux') ||
    roleTitle.toLowerCase().includes('design');
  const isSoftwareWeb =
    blueprint.category === 'Software & Web' ||
    roleTitle.toLowerCase().includes('full stack') ||
    roleTitle.toLowerCase().includes('frontend') ||
    roleTitle.toLowerCase().includes('backend') ||
    roleTitle.toLowerCase().includes('web');

  // Base 24-week master template
  const master24: WeeklyCurriculumItem[] = isUIUX
    ? UI_UX_24_WEEKS
    : isSoftwareWeb
    ? SOFTWARE_WEB_24_WEEKS
    : generateDynamic24Weeks(blueprint.title, blueprint.skills);

  // If exactly 24 weeks, return master
  if (totalWeeks === 24) {
    return master24;
  }

  // If fewer weeks (e.g. 12 weeks for 3 months), sample proportionally
  if (totalWeeks < 24) {
    const sampled: WeeklyCurriculumItem[] = [];
    for (let w = 0; w < totalWeeks; w++) {
      const srcIdx = Math.min(23, Math.round((w / (totalWeeks - 1 || 1)) * 23));
      sampled.push(master24[srcIdx] || master24[0]);
    }
    return sampled;
  }

  // If more weeks (e.g. 36 or 48 weeks for 9 or 12 months), expand gracefully
  const expanded: WeeklyCurriculumItem[] = [...master24];
  const extraWeeksNeeded = totalWeeks - 24;

  for (let i = 0; i < extraWeeksNeeded; i++) {
    const cycleIdx = i % master24.length;
    const baseItem = master24[cycleIdx];
    expanded.push({
      title: `Advanced Deep-Dive: ${baseItem.title}`,
      skills: [...baseItem.skills, 'Production Mastery'],
      tasks: baseItem.tasks.map((t) => ({
        ...t,
        title: `Advanced Mastery: ${t.title}`,
      })),
    });
  }

  return expanded.slice(0, totalWeeks);
}

/**
 * Generates the sequential 1-Week Goals for the chosen career and timeline:
 * Exactly 1 week per goal, no matter the timeline size!
 * e.g., 3 months = 12 weekly goals; 6 months = 24 weekly goals.
 */
export function generateRoadmapForRole(
  roleTitle: string,
  timelineMonths: number = 6,
  dailyMinutes: number = 60
): Milestone[] {
  const blueprint = getOrCreateCareerBlueprint(roleTitle);
  // Total weeks determined by timeline: 1 week per goal!
  const totalWeeks = Math.max(4, Math.round(timelineMonths * 4));
  const weeklyCurriculum = getWeeklyCurriculum(roleTitle, totalWeeks);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effortHoursPerWeek = Math.max(3, Math.round((dailyMinutes * 7) / 60));

  return weeklyCurriculum.map((item, idx) => {
    const weekNum = idx + 1;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + idx * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // Exactly 7 days (e.g. Mon - Sun)

    // First week is doing by default, rest are todo
    const status: Milestone['status'] = idx === 0 ? 'doing' : 'todo';

    return {
      id: `m_${blueprint.slug}_w${weekNum}`,
      roadmap_id: `rm_${blueprint.slug}`,
      user_id: 'usr_current',
      title: item.title,
      position: weekNum,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status,
      effort_hours: effortHoursPerWeek,
      week_range: `Week ${weekNum}`,
      skills_covered: item.skills,
    };
  });
}

/**
 * Generates concrete, checkable tasks for each 1-week goal milestone.
 * User can tap any goal as done.
 */
export function generateTasksForMilestones(
  milestones: Milestone[],
  roleTitle: string
): Task[] {
  const totalWeeks = milestones.length;
  const weeklyCurriculum = getWeeklyCurriculum(roleTitle, totalWeeks);
  const tasks: Task[] = [];

  milestones.forEach((m, mIdx) => {
    const curriculumItem = weeklyCurriculum[mIdx] || weeklyCurriculum[0];

    curriculumItem.tasks.forEach((tTemplate, tIdx) => {
      // First 2 tasks in week 1 are marked done initially so the user has immediate visual momentum
      const isInitialDone = mIdx === 0 && tIdx < 2;

      tasks.push({
        id: `t_${m.id}_${tIdx + 1}`,
        milestone_id: m.id,
        user_id: m.user_id,
        title: tTemplate.title,
        subject: m.title,
        type: tTemplate.type,
        due_date: m.end_date,
        est_minutes: tTemplate.estMinutes || 60,
        progress_pct: isInitialDone ? 100 : 0,
        done_at: isInitialDone ? new Date().toISOString() : null,
      });
    });
  });

  return tasks;
}

/**
 * Handles Zero-Cost Re-planning Actions:
 * - 'behind': shifts active milestone by +3 days
 * - 'early': completes active milestone and pulls next forward
 * - 'pause': shifts all upcoming milestones by +7 days
 */
export function applyQuickPlannerAction(
  milestones: Milestone[],
  actionType: 'behind' | 'early' | 'pause'
): Milestone[] {
  return milestones.map((m) => {
    if (actionType === 'pause' && m.status !== 'done') {
      const start = new Date(m.start_date);
      start.setDate(start.getDate() + 7);
      const end = new Date(m.end_date);
      end.setDate(end.getDate() + 7);
      return {
        ...m,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      };
    }

    if (actionType === 'behind' && m.status === 'doing') {
      const end = new Date(m.end_date);
      end.setDate(end.getDate() + 3);
      return {
        ...m,
        end_date: end.toISOString().split('T')[0],
      };
    }

    if (actionType === 'early' && m.status === 'doing') {
      return {
        ...m,
        status: 'done',
      };
    }

    return m;
  });
}
