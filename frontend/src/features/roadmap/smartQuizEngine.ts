import type { Milestone, QuizOption, Task, TaskQuiz, TaskQuizQuestion } from '../../types';
import type { CareerCategory } from './careerCatalog';

interface RawQuestionSpec {
  question: string;
  correctText: string;
  distractors: [string, string, string];
  explanation: string;
}

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

function fnv1aHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministically shuffles answer choices so the correct option varies unpredictably
 * across a, b, c, and d instead of clustering on fixed option letters.
 */
export function buildShuffledOptions(spec: RawQuestionSpec, seedKey: string): QuizOption[] {
  const entries = [
    { text: spec.correctText, is_correct: true },
    { text: spec.distractors[0], is_correct: false },
    { text: spec.distractors[1], is_correct: false },
    { text: spec.distractors[2], is_correct: false },
  ];

  let state = fnv1aHash(seedKey);
  for (let i = entries.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = entries[i];
    entries[i] = entries[j];
    entries[j] = tmp;
  }

  return entries.map((item, idx) => ({
    id: OPTION_IDS[idx],
    text: item.text,
    is_correct: item.is_correct,
  }));
}

const DOMAIN_SCENARIO_BANK: Record<CareerCategory, RawQuestionSpec[]> = {
  'Software & Web': [
    {
      question: 'In “{task}”, why should server endpoints validate input schemas even when frontend forms already validate?',
      correctText: 'Clients can bypass browser code and send arbitrary payloads directly to HTTP endpoints',
      distractors: [
        'Frontend validation strips HTTP headers before serialization',
        'Server runtimes refuse requests unless JSON fields are duplicated',
        'Browsers ignore required attributes during HTTPS redirects',
      ],
      explanation: 'Client validation improves UX, but only server-side schema and auth validation enforces security and data integrity.',
    },
    {
      question: 'When implementing list views and async fetches for “{skill}”, what prevents stale responses from overwriting newer filters?',
      correctText: 'Cancelling outdated requests or checking a monotonic request counter before committing state',
      distractors: [
        'Wrapping every fetch inside setTimeout(0) blocks',
        'Disabling caching headers on static JavaScript assets',
        'Storing request timestamps inside window.location.hash',
      ],
      explanation: 'Race conditions occur when an earlier slow response resolves after a newer filter change; cancellation or request sequence checks guard state.',
    },
    {
      question: 'During “{task}”, an API call mutates two related database tables. What guarantees neither table ends up half-updated?',
      correctText: 'Executing both mutations inside a single atomic database transaction with constraint checks',
      distractors: [
        'Issuing two parallel Promise.all POST requests from the browser',
        'Hiding error toasts unless both HTTP calls return 500',
        'Retrying the second insert with exponential backoff in localStorage',
      ],
      explanation: 'An atomic transaction commits all changes together or rolls them back cleanly on any failure.',
    },
    {
      question: 'How should secrets or third-party service keys used by “{skill}” be handled in a production web architecture?',
      correctText: 'Kept strictly on server/edge functions behind authenticated requests, never bundled in client code',
      distractors: [
        'Base64-encoded inside frontend environment variables so inspectors hide them',
        'Stored in sessionStorage after login and attached dynamically',
        'Passed via URL query parameters over TLS',
      ],
      explanation: 'Any value shipped in frontend bundles or browser storage is readable by end users; sensitive keys must stay server-side.',
    },
  ],
  'AI & Data Science': [
    {
      question: 'Before scaling features or fitting encoders for “{skill}”, which split discipline avoids subtle data leakage?',
      correctText: 'Split into train, validation, and test sets first, then fit scalers strictly on training folds',
      distractors: [
        'Compute global mean and variance across all rows before partitioning',
        'Oversample minority classes before splitting into train and test',
        'Tune hyperparameters on the holdout test split until variance stabilizes',
      ],
      explanation: 'Fitting preprocessing steps on the combined dataset leaks holdout distribution statistics into training.',
    },
    {
      question: 'For an imbalanced classification task in “{task}”, why can overall accuracy be misleading?',
      correctText: 'A naive majority-class model scores high accuracy while failing completely on rare critical cases',
      distractors: [
        'Accuracy increases logarithmically with batch size',
        'Precision and recall become identical under skewed distributions',
        'Cross-entropy loss ignores minority class weights by default',
      ],
      explanation: 'PR-AUC, F1, calibration, and slice-level recall give an honest view when classes are imbalanced.',
    },
    {
      question: 'Once a model built for “{skill}” is deployed, what early signal indicates concept or data drift?',
      correctText: 'Shifting live input feature distributions or divergence between predicted probabilities and delayed outcomes',
      distractors: [
        'Static training loss plots remaining unchanged in notebook history',
        'Decreasing container memory usage after model warmup',
        'A higher number of model weights stored in checkpoint files',
      ],
      explanation: 'Monitoring input feature drift, prediction confidence shifts, and real-world outcome quality catches silent degradation.',
    },
    {
      question: 'What establishes a credible baseline when evaluating experiments for “{task}”?',
      correctText: 'Benchmarking against a simple interpretable baseline using the same split and evaluation metric',
      distractors: [
        'Reporting only the best single seed run without variance',
        'Comparing training-set loss across unrelated feature schemas',
        'Choosing whichever metric favors the complex model post-hoc',
      ],
      explanation: 'A disciplined baseline on a locked split shows whether added complexity produces genuine gains.',
    },
  ],
  'Cloud & DevOps': [
    {
      question: 'Why should infrastructure changes in “{task}” use declarative IaC with peer review instead of manual console edits?',
      correctText: 'Declarative definitions keep environments reproducible, auditable, and safe to roll back',
      distractors: [
        'Cloud consoles automatically delete IAM policies after 30 days',
        'Manual edits disable container health probes at runtime',
        'Declarative files run without network authentication',
      ],
      explanation: 'Versioned IaC eliminates configuration drift and creates clear audit trails before applying infrastructure changes.',
    },
    {
      question: 'When hardening IAM roles for “{skill}”, what principle minimizes blast radius?',
      correctText: 'Granting least-privilege permissions scoped tightly to required actions and specific resources',
      distractors: [
        'Sharing one wildcard admin role across staging and production',
        'Embedding static long-lived access keys inside container images',
        'Disabling audit logging to lower storage overhead',
      ],
      explanation: 'Scoping permissions to the exact actions and resources needed ensures compromised credentials cannot access unrelated systems.',
    },
    {
      question: 'When calling an external dependency inside “{skill}”, what protects the service against cascading timeouts?',
      correctText: 'Bounded timeouts, capped retries with jitter, and circuit-breaking fallback behavior',
      distractors: [
        'Infinite synchronous retries until the dependency responds',
        'Disabling health checks during traffic spikes',
        'Storing failed payloads in in-memory global arrays indefinitely',
      ],
      explanation: 'Strict timeouts and jittered retries prevent thread/connection exhaustion when downstream dependencies degrade.',
    },
    {
      question: 'What distinguishes actionable observability from simple log collection in “{task}”?',
      correctText: 'Correlated metrics, traces, and structured logs tied directly to user-facing SLOs and alert ownership',
      distractors: [
        'Logging raw request bodies on every healthcheck endpoint',
        'Triggering alerts on CPU fluctuations without latency context',
        'Replacing error budgets with daily manual dashboard screenshots',
      ],
      explanation: 'Structured telemetry linked to SLO burn rates surfaces real user impact without alert fatigue.',
    },
  ],
  Cybersecurity: [
    {
      question: 'When performing a security check for “{skill}”, why must client-hidden fields or disabled buttons never be treated as access controls?',
      correctText: 'Attackers replay and craft HTTP requests directly outside the browser UI',
      distractors: [
        'CSS display rules strip authorization headers from POST bodies',
        'TLS encrypts form controls unevenly across browsers',
        'Disabled DOM elements automatically submit empty JWT tokens',
      ],
      explanation: 'All authorization and ownership checks must be enforced server-side from verified session claims.',
    },
    {
      question: 'How does strict parameterized querying protect endpoints built around “{task}”?',
      correctText: 'It separates SQL structure from untrusted input values so payloads cannot alter query logic',
      distractors: [
        'It compresses database indexes before executing joins',
        'It hashes every user input string with SHA-256 automatically',
        'It restricts SELECT statements to read-only replicas',
      ],
      explanation: 'Parameter binding guarantees user-supplied values are treated strictly as data rather than executable SQL syntax.',
    },
    {
      question: 'During incident triage for “{skill}”, why preserve volatile logs and session artifacts before wiping compromised nodes?',
      correctText: 'Forensic evidence establishes root cause, timeline, blast radius, and whether persistence mechanisms remain',
      distractors: [
        'Deleted logs automatically trigger firewall rule resets',
        'Preserving logs keeps compromised tokens valid longer',
        'Audit regulations forbid shutting down infected hosts for 72 hours',
      ],
      explanation: 'Clean containment pairs isolating active exposure with capturing intact forensic context so the root vector is closed.',
    },
    {
      question: 'Why verify a remediated vulnerability in “{task}” with an explicit regression exploit test?',
      correctText: 'A code diff alone does not prove adjacent routes, edge encodings, or policy layers are closed',
      distractors: [
        'Automated scanners ignore patched files for 48 hours',
        'Unit tests only execute on development databases',
        'Regression tests encrypt source maps in production bundles',
      ],
      explanation: 'Re-testing the attack path and adjacent bypass vectors confirms the control actually blocks exploitation.',
    },
  ],
  'Mobile & Multiplatform': [
    {
      question: 'Why must flows in “{skill}” persist critical form or navigation state across OS background termination?',
      correctText: 'Mobile operating systems reclaim backgrounded app memory unpredictably and expect seamless restoration',
      distractors: [
        'Background apps lose network TLS certificates every five minutes',
        'React Native and Flutter wipe AsyncStorage on screen rotation',
        'Push notifications restart the device bootloader',
      ],
      explanation: 'Restoring task state cleanly after process death prevents lost user work and abrupt resets.',
    },
    {
      question: 'When testing “{task}”, why are mid-tier physical devices and poor connectivity essential alongside fast simulators?',
      correctText: 'Simulators mask real frame drops, thermal throttling, touch-target Ergonomics, and flaky offline transitions',
      distractors: [
        'Simulators disable all local storage APIs by default',
        'Physical devices use larger bundle identifiers at runtime',
        'Network proxies cannot simulate latency on desktop OSes',
      ],
      explanation: 'Validating on real hardware under constrained networks uncovers latency, layout, and permission edge cases early.',
    },
    {
      question: 'What is the trustworthy way to request sensitive runtime permissions in “{skill}”?',
      correctText: 'Request only when the user initiates the relevant action, with a clear rationale and graceful fallback if denied',
      distractors: [
        'Prompt for every hardware permission sequentially on first launch',
        'Block app startup permanently if optional permissions are declined',
        'Cache denied permission booleans without rechecking OS settings',
      ],
      explanation: 'Contextual permission prompts earn user trust and preserve core workflows when users decline optional access.',
    },
  ],
  'Game Dev & 3D': [
    {
      question: 'Why should gameplay physics and movement in “{skill}” scale by fixed timestep / deltaTime rather than raw frame count?',
      correctText: 'Variable frame rates otherwise make movement speeds inconsistent across 60Hz, 120Hz, and slower GPUs',
      distractors: [
        'Shaders refuse to compile unless deltaTime equals 16ms',
        'Fixed timesteps double VRAM texture compression ratios',
        'Audio buffers stop looping when frame rates exceed 60 FPS',
      ],
      explanation: 'Decoupling simulation steps from render frame rate keeps physics deterministic and responsive across hardware.',
    },
    {
      question: 'What is the most reliable way to diagnose frame drops while building “{task}”?',
      correctText: 'Capture GPU/CPU profiler traces on representative scenes on target hardware to separate draw-call vs shader bottlenecks',
      distractors: [
        'Count total lines of gameplay script files',
        'Disable collision detection across static meshes permanently',
        'Measure FPS only inside an empty test scene',
      ],
      explanation: 'Frame-time profiling identifies whether bottlenecks sit in CPU scripts, draw calls, memory allocations, or fragment shaders.',
    },
    {
      question: 'In “{skill}”, what protects player save data when a schema version evolves across patches?',
      correctText: 'Versioned save headers with deterministic forward migrations and backup fallback before overwriting',
      distractors: [
        'Deleting older player profiles silently on patch launch',
        'Storing serialized C++ memory pointers directly on disk',
        'Disabling cloud sync until every user manually exports saves',
      ],
      explanation: 'Versioned migrations ensure existing players never lose progression when data structures grow.',
    },
  ],
  'UI/UX & Product Design': [
    {
      question: 'During usability validation of “{task}”, why observe users completing realistic tasks instead of asking if they like the layout?',
      correctText: 'Task completion exposes friction, mental-model mismatches, and drop-off points that opinion questions miss',
      distractors: [
        'Participants always prefer monochrome wireframes over color',
        'Usability metrics forbid asking follow-up questions afterward',
        'Figma prototypes automatically calculate conversion funnels',
      ],
      explanation: 'Behavioral observation measures what users actually struggle with rather than polite subjective praise.',
    },
    {
      question: 'What ensures components designed for “{skill}” remain accessible to keyboard and screen-reader users?',
      correctText: 'Clear focus visibility, semantic hierarchy, >=4.5:1 contrast, and non-color state indicators',
      distractors: [
        'Removing focus outlines so buttons look minimal',
        'Communicating error states exclusively through red border tint',
        'Placing interactive icons inside unlabeled div elements',
      ],
      explanation: 'Accessible interfaces pair visual clarity with semantic labels, keyboard operability, and multi-sensory cues.',
    },
    {
      question: 'What makes a design handoff for “{skill}” complete for frontend engineering?',
      correctText: 'Documented responsive breakpoints plus loading, empty, error, hover, focus, and overflow states',
      distractors: [
        'Exporting a single desktop happy-path PNG screenshot',
        'Hardcoding pixel widths without fluid constraints or tokens',
        'Leaving validation rules undocumented for later tickets',
      ],
      explanation: 'Documenting edge states and design tokens prevents implementation guesswork and visual regressions.',
    },
  ],
  'Product & Agile Leadership': [
    {
      question: 'When framing a product initiative like “{task}”, why pair target outcome metrics with guardrail metrics?',
      correctText: 'Guardrails detect unintended harm—such as churn, latency, or support load—while chasing the primary KPI',
      distractors: [
        'Guardrails replace qualitative user interviews entirely',
        'Primary metrics cannot be logged without two separate databases',
        'Guardrails allow teams to ship experiments without defining success',
      ],
      explanation: 'Balancing target gains against guardrails ensures short-term metric lifts do not degrade core user trust.',
    },
    {
      question: 'How should competing stakeholder requests around “{skill}” be prioritized transparently?',
      correctText: 'Score options against customer impact, confidence of evidence, strategic fit, effort, and opportunity cost',
      distractors: [
        'Commit to whichever request arrived most recently in chat',
        'Split engineering capacity equally across every request regardless of impact',
        'Prioritize features purely by visual polish',
      ],
      explanation: 'Evidence-weighted frameworks align teams around measurable outcomes instead of loudest-voice bias.',
    },
    {
      question: 'After launching “{skill}”, what proves the feature solved the intended user problem?',
      correctText: 'Post-launch telemetry on adoption, task completion, guardrail health, and qualitative user feedback',
      distractors: [
        'Marking the sprint ticket Done on release day',
        'Recording positive internal team demo feedback alone',
        'Checking that server error logs contain zero warnings for one hour',
      ],
      explanation: 'Shipping is the starting point; measuring actual behavioral change confirms whether the hypothesis held.',
    },
  ],
  'QA & Reliability': [
    {
      question: 'When an automated test for “{skill}” fails intermittently, what is the right engineering response?',
      correctText: 'Isolate and fix root causes like async race conditions, shared mutable state, or non-deterministic time',
      distractors: [
        'Add blind 10-second sleeps across the entire test suite',
        'Wrap assertions in try/catch blocks so CI stays green',
        'Rerun the pipeline three times without inspecting the trace',
      ],
      explanation: 'Eliminating flakiness at its root preserves team trust in CI rather than masking real concurrency bugs.',
    },
    {
      question: 'How do unit, integration, and end-to-end tests work together for “{task}”?',
      correctText: 'Unit tests verify pure logic fast; integration checks contracts/DB; targeted E2E validates critical user journeys',
      distractors: [
        'E2E browser tests replace all unit tests cleanly with faster feedback',
        'Code coverage percentage alone proves business logic is bug-free',
        'Manual clicking at release time catches concurrency races reliably',
      ],
      explanation: 'Balancing test speed and realism catches logic, contract, and workflow bugs at the right layer.',
    },
    {
      question: 'What makes a pre-release quality sign-off for “{skill}” trustworthy for stakeholders?',
      correctText: 'Clear scope tested, environment parity, severity breakdown of known issues, and verified rollback criteria',
      distractors: [
        'A green build icon with no linked test scope',
        'Testing only happy-path inputs with mocked success responses',
        'Deferring P1 defect triage until after production rollout',
      ],
      explanation: 'Transparent risk and coverage reporting equips release owners to make sound go/no-go calls.',
    },
  ],
  'FinTech & Web3': [
    {
      question: 'Why must wallet or ledger transfers in “{skill}” never derive amounts or balances from client payloads?',
      correctText: 'Clients can tamper with requests; balances and fee math must execute atomically server-side in integer minor units',
      distractors: [
        'JavaScript floating-point numbers auto-round cents cleanly in browsers',
        'PostgreSQL blocks integer arithmetic inside stored functions',
        'TLS disables JSON number serialization for amounts under 100',
      ],
      explanation: 'Integer cents, server-side computation, row locking, and append-only ledgers prevent race exploits and rounding loss.',
    },
    {
      question: 'How does an idempotency key protect payment confirmation in “{task}” during mobile network drops?',
      correctText: 'Repeated retries return the original transaction result instead of charging the user twice',
      distractors: [
        'It speeds up TLS handshakes between payment gateways',
        'It hides failed transactions from reconciliation reports',
        'It allows duplicate settlements to merge asynchronously later',
      ],
      explanation: 'Idempotency guarantees at-most-once financial side effects across unreliable networks.',
    },
    {
      question: 'Why use an immutable append-only transaction ledger alongside wallet balances for “{skill}”?',
      correctText: 'Every balance change remains auditable and reconcilable instead of silently overwriting prior states',
      distractors: [
        'Append-only tables automatically waive PCI compliance scope',
        'Overwriting balance rows uses more disk I/O than inserts',
        'Ledgers disable foreign-key integrity checks for speed',
      ],
      explanation: 'Immutable ledger entries give complete traceability for disputes, audits, and automated reconciliation.',
    },
  ],
  'Hardware & Robotics': [
    {
      question: 'Why must sensor pipelines in “{skill}” validate bounds and handle timeouts explicitly?',
      correctText: 'Physical sensors experience noise, disconnects, and out-of-range spikes that can trigger unsafe actuator commands',
      distractors: [
        'Digital buses enforce physical safety limits automatically at compile time',
        'Watchdog timers eliminate the need for input sanity checks',
        'Higher clock speeds remove electrical interference from ADC pins',
      ],
      explanation: 'Filtering glitches and enforcing safe fallback states protect hardware when sensors fault.',
    },
    {
      question: 'During embedded firmware validation for “{task}”, why run hardware-in-the-loop (HIL) checks before deployment?',
      correctText: 'Real timing jitter, interrupt contention, and electrical tolerances rarely appear in pure host mocks',
      distractors: [
        'Host compilers ignore memory alignment warnings unless a board is plugged in',
        'HIL tests automatically flash bootloaders without power',
        'Mocked unit tests cannot run arithmetic checks on C structs',
      ],
      explanation: 'Testing with real timing and I/O interfaces exposes interrupt, bus, and thermal issues missed in simulation.',
    },
    {
      question: 'What supports safe over-the-air firmware updates in “{skill}”?',
      correctText: 'Signed firmware images, A/B dual-partition slots, and automatic rollback if health checks fail after boot',
      distractors: [
        'Erasing the single active flash bank before downloading the new image',
        'Allowing unauthenticated HTTP updates to speed field recovery',
        'Skipping CRC checksums on compressed binaries',
      ],
      explanation: 'Signed dual-bank updates prevent power loss or corrupted payloads from bricking deployed devices.',
    },
  ],
  'Enterprise & Applied Tech': [
    {
      question: 'When integrating an enterprise workflow like “{task}” across departments, what reduces costly rework?',
      correctText: 'Aligning data ownership, SLA expectations, role permissions, and exception workflows upfront',
      distractors: [
        'Importing raw spreadsheets directly into production tables without schema checks',
        'Giving all departments super-admin roles during rollout',
        'Skipping dry-run validation on legacy records',
      ],
      explanation: 'Clear ownership, role governance, and clean data contracts keep multi-team rollouts predictable.',
    },
    {
      question: 'How should sensitive customer or operational records used in “{skill}” be governed?',
      correctText: 'Enforce role-based access control, audit logging, and data minimization aligned with retention policy',
      distractors: [
        'Export full customer CSV dumps to shared team chats for fast debugging',
        'Disable access logs on internal admin dashboards',
        'Share one service login across regional contractors',
      ],
      explanation: 'RBAC, least privilege, and traceable audit trails protect regulated enterprise data.',
    },
    {
      question: 'What ensures durable adoption after rolling out “{skill}” across business teams?',
      correctText: 'Role-specific runbooks, feedback channels, monitored KPIs, and clean escalation paths',
      distractors: [
        'Sending a one-time launch email without training or metrics',
        'Removing fallback procedures immediately on day one',
        'Disabling user feedback forms during the first quarter',
      ],
      explanation: 'Structured onboarding, instrumentation, and clear support ownership sustain operational impact.',
    },
  ],
};

function buildSkillApplicationQuestion(
  skillPrimary: string,
  skillSecondary: string,
  stageTitle: string,
  buildTaskTitle: string | undefined
): RawQuestionSpec {
  const focusLabel = skillSecondary
    ? `${skillPrimary} and ${skillSecondary}`
    : skillPrimary;
  const artifactContext = buildTaskTitle
    ? `while completing “${buildTaskTitle}”`
    : `in stage “${stageTitle}”`;

  return {
    question: `When combining ${focusLabel} ${artifactContext}, what demonstrates genuine mastery rather than surface familiarity?`,
    correctText: `Applying ${skillPrimary} cleanly in a working deliverable, verifying edge cases, and documenting why key tradeoffs were made`,
    distractors: [
      `Memorizing ${skillPrimary} syntax definitions without building or testing an artifact`,
      `Copy-pasting an unreviewed template for ${skillPrimary} and skipping failure-state checks`,
      `Focusing exclusively on ${skillSecondary || skillPrimary} styling while leaving core requirements unverified`,
    ],
    explanation: `Real readiness in ${focusLabel} shows when you can build a working solution, anticipate edge cases, and explain architectural choices.`,
  };
}

function buildTroubleshootingQuestion(
  skillName: string,
  practiceTaskTitle: string | undefined,
  stageTitle: string,
  roleTitle: string
): RawQuestionSpec {
  const scenarioSubject = practiceTaskTitle
    ? `the task “${practiceTaskTitle}”`
    : `your work on ${skillName} (${stageTitle})`;

  return {
    question: `During review of ${scenarioSubject} as an aspiring ${roleTitle}, a peer finds it works on your happy-path example but fails under unexpected input. What is your best next move?`,
    correctText: `Reproduce the failing edge case with a minimal test, fix the underlying assumption in ${skillName}, and verify related boundary cases`,
    distractors: [
      `Suppress the failure in the UI and ask users to follow the happy path`,
      `Adjust only the demo example inputs so the test passes unchanged`,
      `Rewrite an unrelated module first without reproducing the reported behavior`,
    ],
    explanation: `Writing a reproduction case and fixing the root boundary assumption strengthens ${skillName} reliability across real-world inputs.`,
  };
}

export interface SmartQuizInput {
  task: Task;
  milestone?: Milestone;
  stageTasks?: Task[];
  roleTitle: string;
  category: CareerCategory;
  stageIndex: number;
  totalStages: number;
}

/**
 * Generates a 3-question smart, stage-specific Checkpoint Assessment.
 * If the task already carries a database-verified question (UUID id from `task_quizzes`),
 * it preserves that question as Question 1 (`requiresServerRpc: true`) so Supabase
 * `submit_task_quiz` succeeds cleanly while adding 2 unique stage/skill questions.
 */
export function buildSmartCheckpointQuiz(input: SmartQuizInput): TaskQuiz {
  const { task, milestone, stageTasks = [], roleTitle, category, stageIndex } = input;
  const existingQuiz = task.quiz;
  const hasServerBackedQuiz =
    Boolean(existingQuiz) &&
    !existingQuiz!.id.startsWith('demo_quiz_') &&
    !existingQuiz!.id.startsWith('local_quiz_');

  const skills = (milestone?.skills_covered ?? []).map((s) => s.trim()).filter(Boolean);
  const primarySkill = skills[0] || milestone?.title || roleTitle;
  const secondarySkill = skills[1] || '';

  const buildSibling = stageTasks.find((t) => t.type === 'Build');
  const practiceSibling = stageTasks.find((t) => t.type === 'Practice');
  const stageTitle = milestone?.title || task.subject || `Stage ${stageIndex + 1}`;

  const bank = DOMAIN_SCENARIO_BANK[category] || DOMAIN_SCENARIO_BANK['Software & Web'];
  const bankPickA = bank[stageIndex % bank.length];
  const bankPickB = bank[(stageIndex + 1) % bank.length];

  const renderDomainSpec = (raw: RawQuestionSpec, slotIndex: number): TaskQuizQuestion => {
    const filledQuestion = raw.question
      .replace(/\{task\}/g, task.title)
      .replace(/\{skill\}/g, slotIndex === 0 ? primarySkill : secondarySkill || primarySkill);
    const filledExplanation = raw.explanation
      .replace(/\{task\}/g, task.title)
      .replace(/\{skill\}/g, primarySkill);

    return {
      id: `${task.id}_q_${slotIndex + 1}`,
      question: filledQuestion,
      options: buildShuffledOptions(raw, `${task.id}:${stageIndex}:${slotIndex}:${roleTitle}`),
      explanation: filledExplanation,
      requiresServerRpc: false,
    };
  };

  const questions: TaskQuizQuestion[] = [];

  if (hasServerBackedQuiz && existingQuiz) {
    questions.push({
      id: existingQuiz.id,
      question: existingQuiz.question,
      options: existingQuiz.options,
      explanation: existingQuiz.explanation || 'Verified against your checkpoint rubric.',
      requiresServerRpc: true,
    });
  } else {
    questions.push(renderDomainSpec(bankPickA, 0));
  }

  // Question 2: Stage-skill & build deliverable scenario (or second distinct domain scenario)
  const skillSpec = buildSkillApplicationQuestion(
    primarySkill,
    secondarySkill,
    stageTitle,
    buildSibling?.title
  );
  questions.push({
    id: `${task.id}_q_2`,
    question: skillSpec.question,
    options: buildShuffledOptions(skillSpec, `${task.id}:skill:${stageIndex}:${primarySkill}`),
    explanation: skillSpec.explanation,
    requiresServerRpc: false,
  });

  // Question 3: Domain scenario B on odd stages or troubleshooting scenario on even stages for maximum variety
  if (stageIndex % 2 === 1 && bank.length > 1) {
    questions.push(renderDomainSpec(bankPickB, 2));
  } else {
    const troubleSpec = buildTroubleshootingQuestion(
      secondarySkill || primarySkill,
      practiceSibling?.title,
      stageTitle,
      roleTitle
    );
    questions.push({
      id: `${task.id}_q_3`,
      question: troubleSpec.question,
      options: buildShuffledOptions(troubleSpec, `${task.id}:trouble:${stageIndex}:${roleTitle}`),
      explanation: troubleSpec.explanation,
      requiresServerRpc: false,
    });
  }

  const primaryQuestion = questions[0];

  return {
    id: existingQuiz?.id || `local_quiz_${task.id}`,
    task_id: task.id,
    question: primaryQuestion.question,
    options: primaryQuestion.options,
    explanation: primaryQuestion.explanation,
    questions,
  };
}
