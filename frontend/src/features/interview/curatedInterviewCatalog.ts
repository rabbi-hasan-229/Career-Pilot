import type { CareerCategory } from '../roadmap/careerCatalog';
import type { InterviewAttempt } from '../../types';

export interface CuratedInterviewQuestion {
  id: string;
  role_category: CareerCategory;
  round: 'Behavioral' | 'Technical' | 'System Design';
  difficulty: 'Junior' | 'Mid' | 'Senior';
  question: string;
  expected_keywords: string[];
  rubric: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  model_answer: string;
  role_tags?: string[];
  follow_up_probes?: string[];
  coaching_hint?: string;
}

export type EvaluatedInterviewAttempt = InterviewAttempt & {
  created_at: string;
  expected_keywords: string[];
  model_answer: string;
};

export const CURATED_INTERVIEW_CATALOG: CuratedInterviewQuestion[] = [
  // 1. Software & Web
  {
    id: 'sw-b-jr',
    role_category: 'Software & Web',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a feature you delivered from a user need through release. What did you build, how did you validate it, and what changed for users?',
    expected_keywords: ['acceptance criteria', 'api contract', 'tests', 'user outcome', 'code review'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'In my previous project (Situation), our users struggled with slow checkout validation (Task). I agreed on an API contract, wrote unit and integration tests, implemented optimistic UI updates with debounced validation (Action), which reduced form abandonment by 18% and improved response time (Result).',
  },
  {
    id: 'sw-b-mid',
    role_category: 'Software & Web',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'Describe a situation where you had a technical disagreement with a teammate on architecture or code design. How did you resolve it?',
    expected_keywords: ['tradeoffs', 'benchmarks', 'team consensus', 'data driven', 'documentation'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'During a redesign of our state layer (Situation), a teammate preferred Redux while I advocated for TanStack Query with lightweight Zustand (Task). I created a benchmark prototype showing bundle size, caching behavior, and server state decoupling (Action). We reviewed tradeoffs together, agreed on TanStack Query, and reduced boilerplate by 40% (Result).',
  },
  {
    id: 'sw-t-jr',
    role_category: 'Software & Web',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'How do you prevent race conditions or duplicate submissions when a user rapidly clicks a form submit button?',
    expected_keywords: ['debounce', 'disable button', 'idempotency key', 'optimistic lock', 'pending state'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I manage a loading or pending state in the UI to disable the submit button immediately upon click. On the network and server boundary, I attach an idempotency key so repeated requests with the same key return the cached outcome without re-executing mutations.',
  },
  {
    id: 'sw-t-mid',
    role_category: 'Software & Web',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'A request can be retried after a timeout and may update several related records. How would you make the operation safe?',
    expected_keywords: ['idempotency', 'transaction', 'authorization', 'constraints', 'atomicity'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I authorize the caller on the server, bind an idempotency key to the request lifecycle, and wrap all related updates in a single ACID transaction with foreign key and unique constraints to guarantee atomicity and prevent duplicate effects.',
  },
  {
    id: 'sw-t-sr',
    role_category: 'Software & Web',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you diagnose and eliminate an event loop blockage in a high-traffic Node.js service?',
    expected_keywords: ['event loop', 'worker threads', 'profiling', 'async non blocking', 'offload sync operations'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I inspect event loop delay using clinic.js or node:perf_hooks. I identify synchronous CPU-heavy operations such as JSON parsing of massive payloads or crypto routines, and offload them to Worker Threads or streaming pipelines, keeping the main loop latency under 10ms.',
  },
  {
    id: 'sw-sd-sr',
    role_category: 'Software & Web',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design a service change that can be released gradually and rolled back if an important user journey degrades.',
    expected_keywords: ['service objective', 'telemetry', 'canary', 'rollback', 'feature flags', 'slo'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I establish SLOs for latency and error rate, wrap the change in a targeted feature flag, deploy a canary instance receiving 5% traffic, continuously evaluate telemetry guardrails, and trigger automatic rollback if error budget burn spikes.',
  },

  // 2. AI & Data Science
  {
    id: 'ai-b-jr',
    role_category: 'AI & Data Science',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a time data quality changed your analysis or model result. How did you discover and address it?',
    expected_keywords: ['provenance', 'missing values', 'validation', 'baseline', 'distribution'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'While analyzing churn predictions (Situation), our test metrics seemed unrealistically high (Task). I checked data provenance and found missing timestamp filters causing future-data leakage (Action). I rebuilt the pipeline with time-based splits, establishing an honest 78% F1-score baseline (Result).',
  },
  {
    id: 'ai-b-mid',
    role_category: 'AI & Data Science',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you communicate complex statistical model limitations and tradeoffs to non-technical business stakeholders?',
    expected_keywords: ['business impact', 'false positives', 'confidence intervals', 'visualizations', 'tradeoffs'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'When deploying a fraud classification model (Situation), executive stakeholders wanted zero fraud (Task). I presented precision-recall tradeoffs in terms of lost revenue versus customer friction using intuitive cost-matrix charts (Action), achieving alignment on an operating threshold that protected 94% of revenue (Result).',
  },
  {
    id: 'ai-t-jr',
    role_category: 'AI & Data Science',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'How do you handle severe class imbalance in a classification dataset without distorting reality?',
    expected_keywords: ['class weights', 'pr auc', 'stratified sampling', 'f1 score', 'resampling'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I avoid relying on accuracy. Instead I use PR-AUC and balanced F1-score as primary metrics, apply stratified train/validation splitting, adjust loss function class weights during training, and calibrate probability thresholds for decision making.',
  },
  {
    id: 'ai-t-mid',
    role_category: 'AI & Data Science',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you evaluate a model when records from the same person or time period could appear in both training and test data?',
    expected_keywords: ['data leakage', 'group split', 'time split', 'holdout', 'temporal validation'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I prevent data leakage by partitioning using GroupKFold by user entity ID or a strict forward-chaining time split. All transformations and encoders are fit strictly on training splits before transforming the holdout.',
  },
  {
    id: 'ai-t-sr',
    role_category: 'AI & Data Science',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'What techniques do you employ to prevent hallucination and enforce structured output in LLM inference pipelines?',
    expected_keywords: ['json schema', 'retrieval augmented generation', 'grounding', 'guardrails', 'temperature zero'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I constrain generation using strict JSON Schema validation (or OpenAI Structured Outputs), ground context via RAG with semantic reranking and cited provenance, set low temperature, and validate outputs against domain invariant schemas.',
  },
  {
    id: 'ai-sd-sr',
    role_category: 'AI & Data Science',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design monitoring for a deployed prediction pipeline where input data and user outcomes can drift.',
    expected_keywords: ['data drift', 'outcome quality', 'privacy', 'fallback', 'ks test', 'latency'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I monitor input feature drift using Kolmogorov-Smirnov tests and PSI against baseline distributions, track delayed ground-truth feedback, anonymize telemetry for privacy, and provide a heuristic fallback rule when drift exceeds thresholds.',
  },

  // 3. Cloud & DevOps
  {
    id: 'cd-b-jr',
    role_category: 'Cloud & DevOps',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a deployment or environment issue you helped resolve. How did you identify the cause and verify recovery?',
    expected_keywords: ['logs', 'health check', 'root cause', 'recovery', 'postmortem'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Following a staging deployment (Situation), services failed readiness probes (Task). I checked container stderr logs and identified an unpopulated database migration secret (Action). I restored the secret via secret manager, re-triggered CI, verified health checks, and documented prevention steps (Result).',
  },
  {
    id: 'cd-b-mid',
    role_category: 'Cloud & DevOps',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'Describe an incident where a production service was degraded. How did you coordinate response under pressure?',
    expected_keywords: ['incident commander', 'communication', 'triage', 'mitigation', 'blameless postmortem'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'When a database connection spike degraded user logins (Situation), I stepped in as incident commander (Task). I created a dedicated status channel, rolled back a rogue background query, scaled read replicas (Action), restored service within 14 minutes, and conducted a blameless postmortem (Result).',
  },
  {
    id: 'cd-t-jr',
    role_category: 'Cloud & DevOps',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'Explain the difference between Docker images and containers, and how multi-stage builds optimize production images.',
    expected_keywords: ['immutable layers', 'running instance', 'multi stage', 'distroless', 'attack surface'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'An image is an immutable template of layers, while a container is an isolated running instance. Multi-stage builds separate compile-time tools (compilers, npm cache) from runtime assets, producing minimal distroless images that reduce container size by over 70% and reduce attack surface.',
  },
  {
    id: 'cd-t-mid',
    role_category: 'Cloud & DevOps',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you provision the same service consistently across development, staging, and production?',
    expected_keywords: ['infrastructure as code', 'least privilege', 'secrets', 'review', 'terraform'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I use reviewed declarative Infrastructure as Code (e.g. Terraform or OpenTofu) with environment-specific variables, centralized secret managers, isolated VPCs, and least-privilege IAM roles provisioned through automated CI pipelines.',
  },
  {
    id: 'cd-t-sr',
    role_category: 'Cloud & DevOps',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you architect zero-downtime database schema migrations for a high-traffic table with hundreds of millions of rows?',
    expected_keywords: ['expand and contract', 'lock timeout', 'concurrent index', 'backfill', 'dual write'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I use the expand-and-contract pattern: add nullable column or dual-write, create indexes with CONCURRENTLY, backfill historical data in bounded asynchronous chunks with low lock timeouts, switch application reads, and finally drop deprecated fields.',
  },
  {
    id: 'cd-sd-sr',
    role_category: 'Cloud & DevOps',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design a reliability plan for a service that depends on a regional cloud service and has a strict recovery target.',
    expected_keywords: ['service level objective', 'failure domain', 'recovery time', 'failover', 'rpo rto'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I define explicit RPO and RTO metrics, deploy active-passive cross-region read replicas with asynchronous stream replication, implement automated Route 53 DNS health-check failover, and run scheduled chaos drills to verify recovery objectives.',
  },

  // 4. Cybersecurity
  {
    id: 'sec-b-jr',
    role_category: 'Cybersecurity',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a security risk you found during development or testing. How did you report it and confirm it was addressed?',
    expected_keywords: ['scope', 'evidence', 'impact', 'retest', 'responsible disclosure'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'During code review of a file upload endpoint (Situation), I noticed user-supplied file extensions were executed directly (Task). I documented a minimal proof of concept demonstrating remote execution risk, reported it via our vulnerability channel (Action), verified the patch utilizing UUID renaming and mime verification, and confirmed safe behavior (Result).',
  },
  {
    id: 'sec-b-mid',
    role_category: 'Cybersecurity',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you handle developer pushback when security compliance controls slow down release velocity?',
    expected_keywords: ['empathy', 'guardrails', 'automation in ci', 'developer experience', 'pragmatism'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I treat security as an enabler rather than a blocker. When developers felt static analysis was noisy (Situation), I audited false positives, integrated SARIF checks directly into PR comments with actionable fix snippets (Action), reducing triage time by 60% while maintaining required compliance gates (Result).',
  },
  {
    id: 'sec-t-jr',
    role_category: 'Cybersecurity',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'What is Cross-Site Scripting (XSS) and what defensive layers prevent it in modern web applications?',
    expected_keywords: ['content security policy', 'contextual encoding', 'httponly cookies', 'react jsx escaping', 'sanitization'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'XSS occurs when malicious scripts are injected into trusted websites. Defense requires defense-in-depth: framework contextual escaping (JSX), strict Content Security Policy (CSP) headers disallowing unsafe-inline, and HttpOnly/SameSite cookie attributes to protect session credentials.',
  },
  {
    id: 'sec-t-mid',
    role_category: 'Cybersecurity',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you investigate a report that one user can access another user’s record by changing an identifier?',
    expected_keywords: ['authorization', 'ownership', 'server side', 'negative test', 'idor'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I reproduce the IDOR in an isolated environment, verify that object lookups rely on client parameters without scoping to auth.uid(), enforce server-side and database RLS ownership checks, and implement automated negative unit tests for unauthorized callers.',
  },
  {
    id: 'sec-t-sr',
    role_category: 'Cybersecurity',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you secure serverless and containerized microservice architectures against lateral movement following initial compromise?',
    expected_keywords: ['zero trust', 'mtls', 'least privilege iam', 'network policies', 'ephemeral credentials'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I apply a Zero Trust model: mutual TLS (mTLS) with SPIFFE/SPIRE identity for all service communication, strict Kubernetes NetworkPolicies blocking default pod-to-pod traffic, ephemeral IAM credentials via OIDC, and read-only container root filesystems.',
  },
  {
    id: 'sec-sd-sr',
    role_category: 'Cybersecurity',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Plan the first response to a confirmed credential exposure affecting a production service.',
    expected_keywords: ['containment', 'revoke credentials', 'preserve evidence', 'rotate', 'audit logs'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I initiate containment by immediately revoking and rotating the exposed credential, preserve immutable access and audit logs for forensic analysis, determine blast radius across services, notify relevant stakeholders, and conduct a post-incident security review.',
  },

  // 5. Mobile & Multiplatform
  {
    id: 'mob-b-jr',
    role_category: 'Mobile & Multiplatform',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a mobile feature that had to work across different device or network conditions. What did you test?',
    expected_keywords: ['lifecycle', 'offline', 'device matrix', 'accessibility', 'network throttling'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I implemented an offline-first notes sync feature (Situation). I tested on low-end Android and modern iOS devices under network throttling (Task), ensuring SQLite local persistence, background queue synchronization, and smooth UI optimistic updates (Action), achieving 99.8% sync reliability (Result).',
  },
  {
    id: 'mob-b-mid',
    role_category: 'Mobile & Multiplatform',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'Describe how you resolved an app store review rejection related to privacy or guidelines.',
    expected_keywords: ['app store guidelines', 'privacy declaration', 'permissions', 'review notes', 'resolution'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Our iOS build was rejected for requested background location permissions (Situation). I audited feature necessity and replaced continuous background location with foreground geofencing on demand (Action). I submitted updated review notes with demo video, securing approval within 24 hours (Result).',
  },
  {
    id: 'mob-t-jr',
    role_category: 'Mobile & Multiplatform',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'How do you optimize mobile scroll performance and avoid dropped frames in large dynamic lists?',
    expected_keywords: ['virtualized list', 'recycling', 'memoization', 'image caching', '60 fps'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I use virtualized list components (FlashList/FlatList) with fixed item heights, memoize row renderers, offload image decoding to native disk caches, and avoid inline function declarations inside renderItem to sustain 60 FPS.',
  },
  {
    id: 'mob-t-mid',
    role_category: 'Mobile & Multiplatform',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you preserve a user’s in-progress task when a mobile app is backgrounded or recreated?',
    expected_keywords: ['persisted state', 'lifecycle', 'restore', 'privacy', 'app state listener'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I listen to AppState transitions, serialize active draft state to encrypted local storage (MMKV or Keychain) upon backgrounding, restore it gracefully upon foreground resume, and clear persisted drafts after successful submission.',
  },
  {
    id: 'mob-t-sr',
    role_category: 'Mobile & Multiplatform',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you architect a shared cross-platform codebase while allowing tailored native UI and platform capabilities?',
    expected_keywords: ['clean architecture', 'platform channels', 'dependency injection', 'native bridges', 'code sharing'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I separate domain logic, repositories, and state models into platform-agnostic packages, declare clean interfaces for platform services (biometrics, push, sensors), and provide platform-specific implementations via native plugins or dependency injection.',
  },
  {
    id: 'mob-sd-sr',
    role_category: 'Mobile & Multiplatform',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design a staged mobile release for a change that touches permissions, local data, and a shared backend.',
    expected_keywords: ['permission review', 'compatibility', 'crash monitoring', 'rollback', 'phased rollout'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I ensure backend API backward compatibility, version the SQLite local database schema with safe migrations, release to 1% then 5% via phased App Store/Play Store rollout, track crash-free sessions via Sentry, and halt rollout immediately if crash rate exceeds 0.2%.',
  },

  // 6. Game Dev & 3D
  {
    id: 'game-b-jr',
    role_category: 'Game Dev & 3D',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a gameplay or 3D interaction you improved after observing people use it. What evidence changed your design?',
    expected_keywords: ['playtest', 'feedback', 'iteration', 'player outcome', 'telemetry'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'In our 3D platformer prototype (Situation), playtesters repeatedly missed jump timings on moving platforms (Task). I recorded playtest telemetry and added coyote time (150ms buffer) and input buffering (Action). Player success rate jumped from 42% to 89% with enthusiastic player feedback (Result).',
  },
  {
    id: 'game-b-mid',
    role_category: 'Game Dev & 3D',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'Describe how you negotiated scope cuts when an ambitious 3D project was falling behind deadline.',
    expected_keywords: ['core gameplay loop', 'prioritization', 'mvp', 'team alignment', 'tradeoffs'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Ahead of an investor demo (Situation), our physics engine and procedural generation were incomplete (Task). I facilitated a priority review focused on the core 30-second gameplay loop (Action), deferred secondary generation features, polished the primary loop, and delivered a high-impact demo on schedule (Result).',
  },
  {
    id: 'game-t-jr',
    role_category: 'Game Dev & 3D',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'Explain draw calls in rendering engines and how mesh instancing reduces GPU overhead.',
    expected_keywords: ['draw calls', 'batching', 'gpu overhead', 'mesh instancing', 'vertex buffers'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'A draw call is a command from CPU to GPU to render an object. High draw calls bottleneck the CPU. Instanced rendering allows drawing thousands of identical meshes with unique transforms and color matrices in a single draw call, drastically cutting overhead.',
  },
  {
    id: 'game-t-mid',
    role_category: 'Game Dev & 3D',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you investigate intermittent frame-time spikes in a scene that performs well on your workstation?',
    expected_keywords: ['target hardware', 'profiling', 'frame time', 'memory', 'garbage collection'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I profile the scene on target hardware using a GPU debugger (RenderDoc/Xcode Instruments). I analyze frame-time graphs to distinguish CPU bottlenecks (e.g. GC pauses or physics ticks) from GPU bottlenecks (overdraw or shader complexity), then optimize object pooling and texture compression.',
  },
  {
    id: 'game-t-sr',
    role_category: 'Game Dev & 3D',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you design a spatial partitioning system for high-performance physics and frustum culling with thousands of entities?',
    expected_keywords: ['bvh', 'octree', 'spatial hashing', 'frustum culling', 'cache coherence'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I implement a dynamic BVH (Bounding Volume Hierarchy) or spatial hash grid for uniform distribution. I align memory in contiguous arrays (SoA pattern) for cache coherence, allowing broadphase collision checks and frustum culling to run in parallel worker jobs.',
  },
  {
    id: 'game-sd-sr',
    role_category: 'Game Dev & 3D',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design deterministic replay or save behavior for a game feature that must survive updates across platforms.',
    expected_keywords: ['state version', 'determinism', 'compatibility', 'migration', 'fixed point'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I decouple logic from rendering using a fixed timestep tick loop, substitute floating-point nondeterminism with fixed-point math for physics, record input command streams, and version serialized state schemas with automated forward migration paths.',
  },

  // 7. UI/UX & Product Design
  {
    id: 'ux-b-jr',
    role_category: 'UI/UX & Product Design',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a design decision you changed after user research or usability testing. What did you observe?',
    expected_keywords: ['user task', 'research evidence', 'prototype', 'iteration', 'usability testing'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'While designing an onboarding flow (Situation), our team assumed users wanted extensive customization upfront (Task). In usability sessions, 4 out of 5 users dropped off during the questionnaire (Action). I redesigned the flow to progressive disclosure after first value creation, improving completion by 32% (Result).',
  },
  {
    id: 'ux-b-mid',
    role_category: 'UI/UX & Product Design',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you balance user experience aspirations with aggressive development timelines and technical constraints?',
    expected_keywords: ['collaboration', 'design engineering alignment', 'mvp', 'tradeoffs', 'system tokens'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I partner directly with frontend engineers during early wireframing. Instead of building bespoke elements, I leverage existing design system primitives and agree on a phased release: ship core functional UX first, then iterate on micro-interactions in subsequent sprints.',
  },
  {
    id: 'ux-t-jr',
    role_category: 'UI/UX & Product Design',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'What constitutes WCAG 2.2 Level AA color contrast compliance for text and UI components?',
    expected_keywords: ['4.5 to 1', '3 to 1', 'normal text', 'large text', 'ui components'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'WCAG AA requires a minimum contrast ratio of 4.5:1 for normal body text against its background, and 3:1 for large text (18pt or 14pt bold) and essential graphical UI components like input borders and icon buttons.',
  },
  {
    id: 'ux-t-mid',
    role_category: 'UI/UX & Product Design',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you make a complex form usable for keyboard and assistive-technology users?',
    expected_keywords: ['labels', 'keyboard', 'focus', 'error identification', 'aria describedby'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I use semantic HTML inputs with explicit label associations, preserve visible high-contrast focus rings, sequence natural DOM tab order, link error messages via aria-describedby, and announce validation state changes via aria-live regions.',
  },
  {
    id: 'ux-t-sr',
    role_category: 'UI/UX & Product Design',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you structure design tokens across themes, modes, and multi-brand platforms?',
    expected_keywords: ['global tokens', 'semantic tokens', 'component tokens', 'dark mode', 'design tokens'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I organize a three-tier token architecture: Tier 1 Global (raw palette e.g. blue-500), Tier 2 Semantic (intent tokens e.g. color-surface-interactive), and Tier 3 Component (e.g. button-primary-bg). Themes and dark modes override only Tier 2, ensuring seamless scalability without breaking UI contracts.',
  },
  {
    id: 'ux-sd-sr',
    role_category: 'UI/UX & Product Design',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'How would you evolve a design system while keeping established product flows consistent and accessible?',
    expected_keywords: ['design tokens', 'component states', 'accessibility', 'adoption', 'deprecation policy'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I version components with strict semver, establish clear deprecation policies with codemods for engineers, embed automated accessibility linters into Figma and GitHub CI, and measure design system adoption metrics across squad repositories.',
  },

  // 8. Product & Agile Leadership
  {
    id: 'prod-b-jr',
    role_category: 'Product & Agile Leadership',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a time you helped a team clarify an unclear request. How did you agree on the user outcome?',
    expected_keywords: ['user problem', 'acceptance criteria', 'stakeholders', 'outcome', 'alignment'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'When given a vague request to "improve exports" (Situation), I led a discovery session with users and engineers (Task). We identified that users specifically needed CSV format for tax reconciliation (Action), established clear acceptance criteria, and delivered a focused export tool on time (Result).',
  },
  {
    id: 'prod-b-mid',
    role_category: 'Product & Agile Leadership',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you say "no" to a high-priority feature request from an executive or major client without damaging relationships?',
    expected_keywords: ['empathy', 'strategic priorities', 'opportunity cost', 'data backed', 'roadmap visibility'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I listen with empathy to understand their underlying objective, validate the value, and present our current roadmap commitments alongside the opportunity cost of pausing ongoing initiatives. I offer alternative lightweight solutions or schedule the request for next quarter discovery.',
  },
  {
    id: 'prod-t-jr',
    role_category: 'Product & Agile Leadership',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'How do you write effective User Stories with clear, testable Acceptance Criteria using Gherkin syntax?',
    expected_keywords: ['user story', 'given when then', 'acceptance criteria', 'definition of done', 'value statement'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I write stories following "As a [role], I want [capability] so that [benefit]". For criteria, I use Given-When-Then (Gherkin): Given a user with an active roadmap, When they click Complete Task, Then XP is awarded and next task unlocks.',
  },
  {
    id: 'prod-t-mid',
    role_category: 'Product & Agile Leadership',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you prioritize two requests when one has strong user evidence and the other has a senior sponsor?',
    expected_keywords: ['evidence', 'impact', 'risk', 'opportunity cost', 'rice score'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I evaluate both through an objective RICE framework (Reach, Impact, Confidence, Effort). I present the findings transparently to the sponsor, showing expected ROI and risk, and propose a rapid spike or experiment to de-risk the senior sponsor’s hypothesis.',
  },
  {
    id: 'prod-t-sr',
    role_category: 'Product & Agile Leadership',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you establish North Star metrics and input drivers to align multidisciplinary engineering squads?',
    expected_keywords: ['north star metric', 'input metrics', 'leading indicators', 'retention', 'kpi'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I identify a North Star that measures customer value delivered over time (e.g. Weekly Verified Checkpoint Completions), decompose it into team-owned input metrics (Onboarding conversion, daily study retention, quiz pass rate), and review them weekly in team dashboards.',
  },
  {
    id: 'prod-sd-sr',
    role_category: 'Product & Agile Leadership',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'How would you evaluate a product experiment that improves conversion but worsens a user-protection metric?',
    expected_keywords: ['hypothesis', 'guardrail metric', 'decision rule', 'user impact', 'experiment review'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I adhere to pre-experiment guardrail rules. If conversion gains compromise user safety, privacy, or trust, the experiment must not roll out. I investigate affected segments and formulate a revised hypothesis that achieves conversion without violating trust guardrails.',
  },

  // 9. QA & Reliability
  {
    id: 'qa-b-jr',
    role_category: 'QA & Reliability',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a defect you helped prevent or detect before release. How did you reproduce and communicate it?',
    expected_keywords: ['reproduction steps', 'severity', 'evidence', 'regression', 'bug report'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'During pre-release testing of our payment gateway (Situation), currency conversions were truncating fractional cents (Task). I captured network traces, provided step-by-step reproduction notes and severity justification (Action), verified the fix with precision decimal arithmetic, and added automated regression tests (Result).',
  },
  {
    id: 'qa-b-mid',
    role_category: 'QA & Reliability',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you advocate for test automation and test coverage when engineers claim they lack time to write tests?',
    expected_keywords: ['culture of quality', 'velocity', 'ci integration', 'regression prevention', 'shift left'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I demonstrate that writing automated tests accelerates development by cutting manual verification time in half. I pair with engineers to provide reusable test helpers and seed factories, integrating fast tests into pre-commit and CI workflows.',
  },
  {
    id: 'qa-t-jr',
    role_category: 'QA & Reliability',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'Explain the Test Pyramid and why UI end-to-end tests should be fewer in number compared to unit tests.',
    expected_keywords: ['test pyramid', 'unit tests', 'integration tests', 'e2e tests', 'execution time'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'The Test Pyramid advocates a broad base of fast, reliable unit tests, a middle layer of integration tests, and a small peak of end-to-end UI tests. E2E tests are slower to execute, more resource-intensive, and prone to environmental flakiness.',
  },
  {
    id: 'qa-t-mid',
    role_category: 'QA & Reliability',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you diagnose a flaky automated test that intermittently fails in CI but passes locally?',
    expected_keywords: ['shared state', 'timing', 'environment', 'deterministic', 'async await'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I examine test logs and trace artifacts for race conditions, uncontrolled asynchronous operations, and polluted shared state. I replace arbitrary timeouts with explicit assertion polling, isolate test database instances, and ensure tests run deterministically in any order.',
  },
  {
    id: 'qa-t-sr',
    role_category: 'QA & Reliability',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you design a robust load and stress testing strategy to determine maximum concurrent user capacity?',
    expected_keywords: ['load testing', 'stress testing', 'p95 latency', 'k6', 'bottleneck identification'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I model realistic user journeys using k6 or Locust, establish ramp-up and sustained load profiles, measure p95/p99 response latency and server CPU/memory, identify database connection saturation, and define safe operating capacity limits.',
  },
  {
    id: 'qa-sd-sr',
    role_category: 'QA & Reliability',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design release-quality signals for a critical user workflow that spans several services.',
    expected_keywords: ['risk based', 'service indicators', 'failure injection', 'rollback', 'synthetic monitoring'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I map critical failure domains, implement continuous synthetic monitoring probing end-to-end transaction health, perform controlled chaos/failure injection in staging, and enforce automated release gates tied to error budgets and SLO thresholds.',
  },

  // 10. FinTech & Web3
  {
    id: 'fin-b-jr',
    role_category: 'FinTech & Web3',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a time you found a discrepancy between a transaction record and a reported balance. How did you investigate?',
    expected_keywords: ['reconciliation', 'event history', 'precision', 'audit trail', 'investigation'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'While reviewing daily settlement batches (Situation), user wallet balances did not match the ledger total (Task). I audited event logs and identified unrounded fractional token decimals in batch fees (Action). I corrected the fee formula to integer satoshis/cents, reconciled affected balances, and added automated reconciliation alerts (Result).',
  },
  {
    id: 'fin-b-mid',
    role_category: 'FinTech & Web3',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you balance financial regulatory compliance (KYC/AML) with friction-free user onboarding?',
    expected_keywords: ['progressive kyc', 'risk tiering', 'compliance', 'friction reduction', 'fraud prevention'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I implement tiered progressive KYC. Users can browse and explore immediately with low deposit limits, while higher-volume trading or fiat withdrawals require document verification, maximizing onboarding conversion while maintaining regulatory compliance.',
  },
  {
    id: 'fin-t-jr',
    role_category: 'FinTech & Web3',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'Why must financial software avoid IEEE 754 floating-point types for currency calculations, and what should be used instead?',
    expected_keywords: ['floating point error', 'arbitrary precision', 'integer cents', 'bignumber', 'rounding errors'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Floating-point arithmetic suffers from binary rounding errors (e.g. 0.1 + 0.2 != 0.3), which causes balance drift. Financial systems represent monetary amounts as integer minor units (cents, satoshis) or use arbitrary-precision decimal libraries (BigNumber/BigDecimal).',
  },
  {
    id: 'fin-t-mid',
    role_category: 'FinTech & Web3',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you prevent a retry after a payment timeout from charging a customer twice?',
    expected_keywords: ['idempotency key', 'operation status', 'transaction', 'duplicate', 'atomic check'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I generate a unique client-side idempotency key for the payment intent. The server performs an atomic check-and-insert in the database. If a request with that key was already processed or is in-flight, it returns the established transaction state without re-charging.',
  },
  {
    id: 'fin-t-sr',
    role_category: 'FinTech & Web3',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'What are reentrancy attacks in smart contracts and how do checks-effects-interactions and reentrancy guards prevent them?',
    expected_keywords: ['reentrancy', 'checks effects interactions', 'reentrancy guard', 'state update before external call', 'smart contract security'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Reentrancy occurs when an external contract call executes before the caller updates its internal state, allowing recursive re-entry. Prevention requires the Checks-Effects-Interactions pattern (updating balances before transferring funds) and OpenZeppelin ReentrancyGuard mutexes.',
  },
  {
    id: 'fin-sd-sr',
    role_category: 'FinTech & Web3',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design controls for a high-risk financial adjustment that must be traceable and recoverable.',
    expected_keywords: ['separation of duties', 'append only', 'approval', 'reconciliation', 'immutable audit'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I enforce separation of duties requiring maker-checker dual approval, store immutable append-only ledger entries rather than updating balances in place, generate cryptographic audit logs, and provide reversible compensating transaction workflows.',
  },

  // 11. Hardware & Robotics
  {
    id: 'hw-b-jr',
    role_category: 'Hardware & Robotics',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about an intermittent hardware or sensor failure you investigated. What measurements helped isolate it?',
    expected_keywords: ['controlled conditions', 'calibration', 'measurements', 'reproduction', 'oscilloscope'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'During bench testing of an autonomous rover (Situation), an IMU sensor dropped packets intermittently (Task). I used an oscilloscope to measure voltage rails under motor load and found voltage sag causing brownout resets (Action). I added bypass capacitors, stabilizing power and eliminating sensor loss (Result).',
  },
  {
    id: 'hw-b-mid',
    role_category: 'Hardware & Robotics',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you coordinate design reviews between mechanical, electrical, and firmware engineering teams?',
    expected_keywords: ['cross functional', 'interface control documents', 'cad reviews', 'traceability', 'risk analysis'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I establish clear Interface Control Documents (ICD) defining pinouts, power budgets, and physical envelopes. We conduct structured 3D CAD/PCB overlap reviews before board fabrication, ensuring thermal dissipation and connector clearances are agreed upon.',
  },
  {
    id: 'hw-t-jr',
    role_category: 'Hardware & Robotics',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'Compare I2C, SPI, and UART communication protocols in terms of speed, pin count, and reliability.',
    expected_keywords: ['clock line', 'master slave', 'throughput', 'bus contention', 'pull up resistors'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'UART is asynchronous peer-to-peer using 2 pins. I2C uses 2 pins (SDA/SCL) with open-drain pull-ups supporting multiple addressed devices at moderate speeds (up to 3.4MHz). SPI is full-duplex synchronous using 4+ pins (MOSI, MISO, SCK, CS) providing higher data throughput (>50MHz) for displays and flash memory.',
  },
  {
    id: 'hw-t-mid',
    role_category: 'Hardware & Robotics',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you validate a sensor’s accuracy across its specified operating range?',
    expected_keywords: ['reference instrument', 'tolerance', 'environment', 'calibration', 'error bounds'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I test the sensor against a NIST-traceable calibrated reference instrument across temperature and voltage boundary conditions. I record calibration curve offsets, calculate standard deviations and hysteresis error bounds, and embed correction coefficients into EEPROM.',
  },
  {
    id: 'hw-t-sr',
    role_category: 'Hardware & Robotics',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you implement fail-safe watchdog timers and crash recovery in real-time embedded systems?',
    expected_keywords: ['watchdog timer', 'interrupt latency', 'brownout detection', 'safe state', 'reboot telemetry'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I configure hardware watchdog timers requiring servicing from the lowest-priority thread to verify scheduler health. Upon timeout or brownout reset, hardware actuators are driven to passive fail-safe states, and crash dumps are logged to non-volatile flash for postmortem analysis.',
  },
  {
    id: 'hw-sd-sr',
    role_category: 'Hardware & Robotics',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Design a safe production test and service process for a connected device with firmware and moving components.',
    expected_keywords: ['safety limits', 'firmware version', 'diagnostics', 'traceability', 'end of line testing'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I design an automated End-of-Line (EOL) test fixture with physical safety interlocks, flash cryptographic keys, run boundary diagnostic sweeps, verify calibrated limits, and record unique serial IDs and test telemetry into an immutable manufacturing database.',
  },

  // 12. Enterprise & Applied Tech
  {
    id: 'ent-b-jr',
    role_category: 'Enterprise & Applied Tech',
    round: 'Behavioral',
    difficulty: 'Junior',
    question: 'Tell me about a time you aligned people from different teams before changing a shared workflow.',
    expected_keywords: ['stakeholders', 'current process', 'decision owner', 'communication', 'training'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Our company was upgrading its CRM ticket routing (Situation). Operations and Sales had conflicting priorities (Task). I mapped the current process, hosted alignment sessions to clarify decision owners (Action), piloted the change with one branch, and achieved 95% user satisfaction after training (Result).',
  },
  {
    id: 'ent-b-mid',
    role_category: 'Enterprise & Applied Tech',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'How do you handle technical debt in legacy enterprise systems while continuing to deliver new business capabilities?',
    expected_keywords: ['strangler fig pattern', 'incremental modernization', 'business case', 'risk mitigation', 'velocity'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I use the Strangler Fig pattern rather than high-risk big-bang rewrites. I build new microservices around legacy boundaries, incrementally routing capabilities to modern APIs. I frame debt remediation in business terms: reduced maintenance costs and faster feature delivery.',
  },
  {
    id: 'ent-t-jr',
    role_category: 'Enterprise & Applied Tech',
    round: 'Technical',
    difficulty: 'Junior',
    question: 'What is Single Sign-On (SSO) and how does SAML / OpenID Connect (OIDC) authenticate enterprise users?',
    expected_keywords: ['identity provider', 'service provider', 'tokens', 'oauth oidc', 'security assertions'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'SSO allows users to authenticate once through a central Identity Provider (IdP e.g. Okta, Azure AD). SAML exchanges signed XML assertions between IdP and Service Provider. OIDC builds on OAuth 2.0 using signed JSON Web Tokens (ID tokens) to verify user identity.',
  },
  {
    id: 'ent-t-mid',
    role_category: 'Enterprise & Applied Tech',
    round: 'Technical',
    difficulty: 'Mid',
    question: 'How would you integrate two enterprise systems when ownership and data formats differ?',
    expected_keywords: ['versioned contract', 'data ownership', 'validation', 'failure handling', 'event driven integration'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I establish an explicit versioned contract and define field-level ownership. I implement schema validation middleware with dead-letter queues for malformed payloads, ensuring asynchronous decoupling and complete observability of integration failures.',
  },
  {
    id: 'ent-t-sr',
    role_category: 'Enterprise & Applied Tech',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you implement Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) in multi-tenant enterprise software?',
    expected_keywords: ['rbac', 'abac', 'least privilege', 'tenant isolation', 'policy engine'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I define roles for coarse permissions and overlay ABAC policies (evaluating tenant ID, departmental department, and resource state). I enforce policies centrally using a policy engine (e.g. Open Policy Agent) and at the database boundary via Row Level Security.',
  },
  {
    id: 'ent-sd-sr',
    role_category: 'Enterprise & Applied Tech',
    round: 'System Design',
    difficulty: 'Senior',
    question: 'Plan a rollout that migrates business-critical records while keeping teams operational.',
    expected_keywords: ['pilot', 'reconciliation', 'support readiness', 'rollback', 'dual write'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'I design a dual-write sync pipeline with automated reconciliation reports. I pilot the cutover with a 5% user group, establish dedicated 24/7 hypercare support, verify zero discrepancy between old and new systems, and stage the final cutover during low-activity windows with an immediate rollback trigger.',
  },
];

/**
 * Role-specialized authentic interview questions that surface first when
 * the candidate's targetRole matches specific specializations (Frontend,
 * Next.js, Backend, APIs, ML/LLM, DevOps, Security, Mobile, Design, etc.).
 */
export const ROLE_SPECIALIST_QUESTIONS: CuratedInterviewQuestion[] = [
  // Frontend / React / Next.js
  {
    id: 'spec-fe-rendering',
    role_category: 'Software & Web',
    round: 'Technical',
    difficulty: 'Mid',
    role_tags: ['frontend', 'react', 'next', 'nextjs', 'ui', 'web', 'full stack', 'fullstack'],
    question: 'A core dashboard page feels sluggish when users filter a large dataset and switch tabs quickly. Walk me through how you would diagnose the bottleneck and fix it cleanly.',
    expected_keywords: ['profiling', 're-render', 'memoization', 'debouncing', 'virtualization', 'stale request'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Think like you are pairing on a real bug: mention how you measure first (profiler/flamegraph) before jumping to memoization or list virtualization, plus how you handle stale async responses.',
    follow_up_probes: [
      'If two filter requests race and the older response resolves last, how do you prevent stale rows from flashing into the UI?',
      'When would you reach for virtualization vs pagination vs moving the filtering server-side?',
    ],
    model_answer: 'I would open React DevTools Profiler and browser Performance traces to verify whether the lag comes from expensive synchronous filtering, excessive component re-renders, or DOM layout thrashing. From there, I stabilize props/derived state, debounce filter queries with AbortController to cancel stale responses, virtualize or paginate large tables, and measure INP/frame timings afterward.',
  },
  {
    id: 'spec-fe-ssr-cache',
    role_category: 'Software & Web',
    round: 'System Design',
    difficulty: 'Mid',
    role_tags: ['next', 'nextjs', 'frontend', 'full stack', 'fullstack', 'react'],
    question: 'You are building a multi-user workspace app in Next.js or React with fast initial loads, personalized user state, and live updates. How do you decide what renders on the server vs the client, and how do you avoid showing stale data?',
    expected_keywords: ['server components', 'hydration', 'cache invalidation', 'auth boundary', 'optimistic ui'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Consider first-byte latency, SEO/auth boundaries, bundle size, and what happens right after a mutation succeeds.',
    follow_up_probes: [
      'How do you prevent a shared server cache from leaking one tenant or user session into another user’s response?',
      'If an optimistic update fails on the server, how do you roll back the UI cleanly without jarring the user?',
    ],
    model_answer: 'I keep static shells, non-interactive layouts, and initial authenticated reads on the server to shrink client JS bundles and avoid waterfall fetches, while keeping interactive controls and live subscriptions in client components. Cache keys are strictly scoped by user/tenant when personalized, and mutations trigger targeted cache revalidation plus rollback-safe optimistic UI.',
  },
  // Backend / Distributed APIs
  {
    id: 'spec-be-nplus1',
    role_category: 'Software & Web',
    round: 'Technical',
    difficulty: 'Mid',
    role_tags: ['backend', 'api', 'node', 'python', 'java', 'go', 'sql', 'postgres', 'full stack', 'fullstack'],
    question: 'A previously fast API endpoint starts timing out under morning peak traffic right after a new feature added nested resource counts. How do you investigate and eliminate the latency spike?',
    expected_keywords: ['n+1 query', 'explain analyze', 'index', 'connection pool', 'pagination', 'latency'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Start with observability—APM/query logs and EXPLAIN ANALYZE—then consider query shape, indexing, and connection pool saturation.',
    follow_up_probes: [
      'How do you verify adding a new composite index won’t degrade write throughput on a hot table?',
      'If the connection pool is saturated even after query tuning, what architectural levers do you pull next?',
    ],
    model_answer: 'I inspect request traces and Postgres slow-query logs to spot an N+1 query loop or sequential scan. Using EXPLAIN ANALYZE, I replace per-item round trips with a single batched JOIN or aggregation, add a targeted composite index if selectivity warrants it, bound page size with cursor pagination, and verify p95 latency and pool wait time drop under load.',
  },
  {
    id: 'spec-be-ratelimit',
    role_category: 'Software & Web',
    round: 'System Design',
    difficulty: 'Senior',
    role_tags: ['backend', 'api', 'distributed', 'microservices', 'serverless', 'node', 'go', 'java'],
    question: 'Design a public API webhook & ingestion service that receives unpredictable bursts from external partners without dropping events or overwhelming your database.',
    expected_keywords: ['queue', 'backpressure', 'idempotency', 'rate limit', 'dead letter queue', 'retry backoff'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Separate fast synchronous ingestion/verification from slower downstream processing, and account for duplicate deliveries.',
    follow_up_probes: [
      'If a downstream consumer goes down for 20 minutes, how do you prevent retry storms when it recovers?',
      'How do you handle out-of-order webhook events for the same entity?',
    ],
    model_answer: 'I authenticate signatures at the edge, enforce per-tenant rate limits, and immediately persist raw events onto a durable queue (SQS/Kafka) so the ingestion endpoint responds 202 quickly. Workers consume at a controlled concurrency with exponential backoff + jitter, deduplicate via idempotency keys, route poison messages to a DLQ, and track entity sequence versions for ordering.',
  },
  // Behavioral engineering leadership & ownership
  {
    id: 'spec-eng-prod-incident',
    role_category: 'Software & Web',
    round: 'Behavioral',
    difficulty: 'Mid',
    role_tags: ['engineer', 'developer', 'frontend', 'backend', 'full stack', 'devops', 'sre'],
    question: 'Tell me about a production bug or outage you helped resolve. Looking back, what was the hardest moment during the incident, and what changed permanently afterward?',
    expected_keywords: ['root cause', 'mitigation', 'rollback', 'monitoring', 'postmortem', 'prevention'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Interviewers care equally about how fast you stabilized users (mitigate first vs debugging live) and what systemic safeguard prevented recurrence.',
    follow_up_probes: [
      'Why did your existing tests or staging environment miss that issue before it hit production?',
      'If that happened again tomorrow, how quickly would alerts catch it before users noticed?',
    ],
    model_answer: 'After a migration introduced elevated 500s on checkout (Situation), I led triage to restore availability before deep root-causing (Task). We rolled back the release within 8 minutes, isolated a missing null-guard on legacy records via logs, added an automated regression test plus canary alert threshold (Action), cutting mean time to detect under 2 minutes (Result).',
  },
  // AI / LLM / ML Engineering
  {
    id: 'spec-ai-rag-eval',
    role_category: 'AI & Data Science',
    round: 'Technical',
    difficulty: 'Mid',
    role_tags: ['ai', 'llm', 'ml', 'machine learning', 'nlp', 'rag', 'prompt', 'generative'],
    question: 'Your team launches an LLM assistant grounded on internal docs, and stakeholders complain it occasionally hallucinates outdated policies. How do you systematically diagnose and fix it?',
    expected_keywords: ['retrieval', 'evaluation set', 'chunking', 'reranking', 'citations', 'grounding'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Separate retrieval failures (wrong docs fetched) from generation failures (model ignored retrieved context), and build a reproducible eval benchmark.',
    follow_up_probes: [
      'How do you measure whether a change to chunking or embeddings actually improved quality instead of cherry-picking examples?',
      'What fallback should the assistant take when retrieval confidence is low?',
    ],
    model_answer: 'I build a golden evaluation dataset covering current vs deprecated policies and log whether failures stem from retrieval recall or generation faithfulness. I tighten metadata filtering on document freshness/effective dates, combine hybrid BM25 + dense retrieval with reranking, enforce inline citations, and instruct the model to abstain cleanly when evidence is absent.',
  },
  {
    id: 'spec-data-pipeline-sla',
    role_category: 'AI & Data Science',
    round: 'System Design',
    difficulty: 'Mid',
    role_tags: ['data', 'analytics', 'etl', 'pipeline', 'bi', 'sql', 'warehouse'],
    question: 'Upstream product teams keep changing event schemas without notice, breaking executive dashboards every few weeks. How would you redesign the pipeline so breaks are caught before hitting stakeholders?',
    expected_keywords: ['data contract', 'schema validation', 'staging layer', 'quarantine', 'observability', 'backfill'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Cover contract enforcement at ingestion, isolation/quarantine of bad records, alerting, and safe idempotent backfills.',
    follow_up_probes: [
      'Would you reject malformed events outright at ingestion or quarantine them—and what happens to downstream metrics while a fix ships?',
      'How do you keep a schema contract lightweight enough that product engineers actually adopt it?',
    ],
    model_answer: 'I introduce versioned event contracts validated in CI and at ingestion. Non-conforming payloads route to a dead-letter quarantine table while valid partitions flow through staging quality checks (freshness, null/volume anomalies) before atomic table swaps into marts, triggering Slack alerts with replayable backfills.',
  },
  // Cloud / DevOps / SRE
  {
    id: 'spec-devops-cicd-slow',
    role_category: 'Cloud & DevOps',
    round: 'Technical',
    difficulty: 'Mid',
    role_tags: ['devops', 'cloud', 'sre', 'platform', 'kubernetes', 'docker', 'aws', 'terraform', 'ci/cd'],
    question: 'Engineers complain CI/CD builds take 35 minutes and flaky deployments frequently stall releases. Where would you look first, and how do you rebuild trust in the pipeline?',
    expected_keywords: ['caching', 'parallelism', 'ephemeral', 'canary', 'flaky tests', 'deployment frequency'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Look at critical-path pipeline stages, dependency/layer caching, test isolation, and safe progressive delivery.',
    follow_up_probes: [
      'How do you quarantine flaky tests without quietly letting real regressions slip into main?',
      'What deployment guardrails give teams confidence to ship multiple times a day without manual QA sign-off?',
    ],
    model_answer: 'I instrument stage timings to spot bottlenecks—usually uncached Docker/package layers and serial integration tests. I split unit vs targeted E2E suites in parallel, introduce remote build/layer caching, quarantine tracked flaky specs with ownership SLAs, and pair automated canary health checks with instant rollback.',
  },
  // Cybersecurity
  {
    id: 'spec-sec-authz-idor',
    role_category: 'Cybersecurity',
    round: 'Technical',
    difficulty: 'Mid',
    role_tags: ['security', 'cyber', 'appsec', 'soc', 'pentest', 'iam'],
    question: 'During a security review, you discover an API endpoint accepts an organization ID from the request body without verifying membership. How do you remediate this cleanly across a codebase—not just patching one route?',
    expected_keywords: ['authorization', 'idor', 'tenant isolation', 'middleware', 'least privilege', 'audit log'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Fix the immediate IDOR vulnerability first, then think structurally: centralized policy/middleware, DB-level RLS, and regression tests.',
    follow_up_probes: [
      'How would you audit historical logs to verify whether that flaw was ever exploited prior to the fix?',
      'Why isn’t client-side validation or opaque UUIDs sufficient protection against IDOR?',
    ],
    model_answer: 'I immediately enforce server-side ownership checks derived from the verified auth token rather than client-supplied tenant IDs, and push defense-in-depth down to database Row Level Security policies. To prevent recurrence, I introduce centralized authorization middleware, add negative cross-tenant integration tests in CI, and scan access logs for anomalous cross-tenant reads.',
  },
  // Mobile
  {
    id: 'spec-mob-offline-sync',
    role_category: 'Mobile & Multiplatform',
    round: 'System Design',
    difficulty: 'Mid',
    role_tags: ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
    question: 'Design an offline-capable mobile experience for field users who lose connectivity in basements or transit, then reconnect hours later.',
    expected_keywords: ['local persistence', 'sync queue', 'conflict resolution', 'optimistic update', 'idempotency'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Address local storage, queued outbox mutations, retry triggers on network restoration, and clear conflict resolution UX.',
    follow_up_probes: [
      'If two users edit the same checklist item offline, how do you resolve the merge without silently overwriting data?',
      'How do you avoid draining battery with aggressive sync retries on poor cellular connections?',
    ],
    model_answer: 'I treat a local SQLite/Store database as the UI source of truth so reads and writes stay instant offline. Mutations append to a persistent outbox queue with client-generated UUIDs and idempotency keys, sync sequentially with OS background constraints and exponential backoff when reachable, and surface non-destructive conflict prompts when entity versions diverge.',
  },
  // UI/UX & Product Design
  {
    id: 'spec-ux-handoff-tradeoff',
    role_category: 'UI/UX & Product Design',
    round: 'Behavioral',
    difficulty: 'Mid',
    role_tags: ['design', 'ui', 'ux', 'product designer', 'figma'],
    question: 'Tell me about a time engineering constraints or an urgent deadline forced you to simplify an ideal user experience. How did you protect user clarity while still shipping on time?',
    expected_keywords: ['user flow', 'tradeoffs', 'accessibility', 'mvp scope', 'usability testing', 'iteration'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Explain how you distinguished core user-value principles from nice-to-have polish and validated the scoped version.',
    follow_up_probes: [
      'How did you track whether the simplified V1 caused confusion once live—and did V2 ever ship?',
      'How do you partner with engineers early enough to avoid late-stage scope surprises?',
    ],
    model_answer: 'When complex inline filtering slipped sprint capacity (Situation), I partnered with engineering to keep core usability intact for release (Task). We preserved clear empty/error states, keyboard accessibility, and high-frequency filters in V1 while deferring saved custom views to V2 with telemetry tracking filter usage (Action), shipping on schedule with 92% task completion (Result).',
  },
  // QA & Reliability
  {
    id: 'spec-qa-release-risk',
    role_category: 'QA & Reliability',
    round: 'Behavioral',
    difficulty: 'Mid',
    role_tags: ['qa', 'quality', 'test', 'sdet', 'automation', 'reliability'],
    question: 'Describe a time a release was scheduled to go out, and you found a subtle issue late in the cycle. How did you assess severity and align engineering and product on the call?',
    expected_keywords: ['severity', 'reproduction', 'risk assessment', 'blast radius', 'stakeholders', 'regression'],
    rubric: { situation: true, task: true, action: true, result: true },
    coaching_hint: 'Show structured risk framing (frequency, blast radius, workaround) rather than either blocking everything blindly or staying silent.',
    follow_up_probes: [
      'How do you prevent late-cycle surprises from becoming normal on a fast-moving team?',
      'What makes you confident an automated check belongs at the unit layer vs full E2E?',
    ],
    model_answer: 'Hours before a major release (Situation), I caught an edge case corrupting saved preferences on Safari mobile (Task). I documented reliable repro steps, quantified affected traffic (~11% of users), proposed shipping behind a kill-switch or holding 4 hours for a targeted patch with Product & Eng leads (Action), preventing user complaints while shipping cleanly same-day (Result).',
  },
];

export function getCuratedInterviewQuestions(category: CareerCategory): CuratedInterviewQuestion[] {
  const matching = CURATED_INTERVIEW_CATALOG.filter((q) => q.role_category === category);
  return matching.length > 0 ? matching : CURATED_INTERVIEW_CATALOG.filter((q) => q.role_category === 'Software & Web');
}

function tokenizeRole(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]+/g, ' ')
    .split(/[\s/,-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

/**
 * Selects real interview questions tailored specifically to both the candidate's
 * career category AND exact targetRole (e.g., "Frontend Engineer" vs "Backend Specialist").
 */
export function getRoleTailoredInterviewQuestions(
  category: CareerCategory,
  targetRole: string,
  preferredRound?: 'Behavioral' | 'Technical' | 'System Design'
): CuratedInterviewQuestion[] {
  const roleLower = targetRole.toLowerCase();
  const roleTokens = tokenizeRole(targetRole);

  const scoreRoleRelevance = (question: CuratedInterviewQuestion): number => {
    let score = question.role_category === category ? 10 : 0;
    const tags = question.role_tags ?? [];
    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase();
      if (roleLower.includes(normalizedTag)) {
        score += 25;
      } else if (roleTokens.some((token) => normalizedTag.includes(token) || token.includes(normalizedTag))) {
        score += 12;
      }
    }
    if (preferredRound && question.round === preferredRound) {
      score += 8;
    }
    return score;
  };

  const combinedPool = [...ROLE_SPECIALIST_QUESTIONS, ...CURATED_INTERVIEW_CATALOG];
  const seen = new Set<string>();
  const candidates: Array<{ question: CuratedInterviewQuestion; relevance: number }> = [];

  for (const question of combinedPool) {
    if (seen.has(question.id)) continue;
    const relevance = scoreRoleRelevance(question);
    // Keep same-category questions + strongly role-matched cross-track questions
    if (question.role_category === category || relevance >= 25) {
      seen.add(question.id);
      candidates.push({ question, relevance });
    }
  }

  candidates.sort((a, b) => b.relevance - a.relevance);
  const result = candidates.map((entry) => entry.question);
  return result.length > 0 ? result : getCuratedInterviewQuestions(category);
}

export function getQuestionFollowUpProbes(
  question: CuratedInterviewQuestion,
  targetRole: string
): string[] {
  if (question.follow_up_probes && question.follow_up_probes.length > 0) {
    return question.follow_up_probes;
  }
  if (question.round === 'Behavioral') {
    return [
      `Looking back at that experience, what would you do differently if you faced a similar situation as a ${targetRole}?`,
      'How did you measure whether the outcome actually solved the underlying problem for the team or users?',
    ];
  }
  if (question.round === 'System Design') {
    return [
      'If traffic or payload volume grew 10x overnight, which component in your design would bottleneck first and why?',
      'What happens when a key dependency degrades or times out—how do you keep the core user journey safe?',
    ];
  }
  return [
    `In a real ${targetRole} codebase, what tradeoff or alternative approach did you consider here?`,
    'How would you test and monitor this in production to catch subtle regressions early?',
  ];
}

export function getQuestionCoachingHint(
  question: CuratedInterviewQuestion,
  targetRole: string
): string {
  if (question.coaching_hint) return question.coaching_hint;
  if (question.round === 'Behavioral') {
    return `Frame one real scenario cleanly: briefly set context, focus 60% on the specific decisions and actions YOU owned for ${targetRole}, and close with a concrete result or lesson.`;
  }
  if (question.round === 'System Design') {
    return 'Clarify scale and failure assumptions first, trace the main data path end-to-end, then call out tradeoffs, bottlenecks, and how you would observe it in production.';
  }
  return `Explain your reasoning out loud as if pairing with a teammate on a ${targetRole} problem: start from first-step diagnosis or invariants, weigh alternatives, and mention validation/edge cases.`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[.,!?;:()"'/\\`]/g, ' ')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministic local scoring engine matching the Supabase Edge Function logic.
 */
export function scoreDeterministicInterviewAnswer(
  question: CuratedInterviewQuestion,
  answer: string,
  requestId = crypto.randomUUID()
): EvaluatedInterviewAttempt {
  const trimmedAnswer = answer.trim();
  const normalizedAnswer = ` ${normalize(trimmedAnswer)} `;
  const containsPhrase = (phrase: string) => normalizedAnswer.includes(` ${normalize(phrase)} `);
  const containsAny = (phrases: string[]) => phrases.some(containsPhrase);

  const expectedKeywords = question.expected_keywords.filter((k) => typeof k === 'string' && k.trim().length > 0);
  const matchedKeywords = expectedKeywords.filter(containsPhrase);

  const behavioral = question.round === 'Behavioral';
  const hasSituation = behavioral
    ? containsAny(['situation', 'context', 'when', 'during', 'team', 'background', 'project', 'company'])
    : containsAny(['context', 'requirement', 'constraint', 'assumption', 'problem', 'scenario', 'use case']);

  const hasTask = behavioral
    ? containsAny(['task', 'goal', 'objective', 'responsible', 'assigned', 'deliverable', 'challenge'])
    : containsAny(['goal', 'objective', 'approach', 'design', 'architecture', 'decision', 'strategy', 'pattern']);

  const hasAction = behavioral
    ? containsAny(['action', 'implemented', 'built', 'optimized', 'deployed', 'led', 'designed', 'refactored', 'developed', 'created', 'solved'])
    : containsAny(['tradeoff', 'tested', 'validated', 'implemented', 'monitored', 'measured', 'benchmarked', 'verified']);

  const hasResult = containsAny(['result', 'outcome', 'reduced', 'improved', 'validated', 'latency', 'availability', 'throughput', 'scalability', 'resilience', 'sla', 'slo', 'delivered', 'achieved', 'increased', 'saved'])
    || /\b\d+(?:\.\d+)?\s*%/.test(trimmedAnswer);

  const structurePoints = (hasSituation ? 15 : 0) + (hasTask ? 15 : 0) + (hasAction ? 20 : 0) + (hasResult ? 20 : 0);
  const keywordPoints = Math.round((matchedKeywords.length / Math.max(1, expectedKeywords.length)) * 30);
  const score = Math.min(100, structurePoints + keywordPoints);
  const rubricFeedback = {
    situation: hasSituation,
    task: hasTask,
    action: hasAction,
    result: hasResult,
  };

  return {
    id: `local_att_${requestId.slice(0, 8)}`,
    question_id: question.id,
    user_answer: trimmedAnswer,
    score,
    matched_keywords: matchedKeywords,
    rubric_feedback: rubricFeedback,
    created_at: new Date().toISOString(),
    expected_keywords: expectedKeywords,
    model_answer: question.model_answer,
  };
}
