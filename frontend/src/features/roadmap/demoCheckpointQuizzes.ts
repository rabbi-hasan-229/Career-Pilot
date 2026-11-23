import type { Milestone, Task, TaskQuiz } from '../../types';
import { findCuratedCareerBlueprint, type CareerCategory } from './careerCatalog';
import { getCheckpointQuizTemplateId, type CheckpointQuizTemplateId } from './checkpointQuizCatalog';
import { domainQuizTemplates } from './domainCheckpointQuizTemplates';
import { buildShuffledOptions, buildSmartCheckpointQuiz } from './smartQuizEngine';

// Development-only mirror of private.checkpoint_quiz_templates. Keep IDs and
// question content in sync; production builds do not include this module.
const demoQuizTemplates = {
  cp_phase_1: {
    question: 'Before starting “{checkpoint}”, what should you establish first?',
    options: [
      { id: 'a', text: 'The problem, context, constraints, and observable success criteria' },
      { id: 'b', text: 'A tool choice before clarifying the goal' },
      { id: 'c', text: 'A deadline that assumes every task will go perfectly' },
      { id: 'd', text: 'A final solution before checking who will use it' },
    ],
    correct: 'a',
    explanation: 'Clear outcomes and constraints make the work focused and reviewable.',
  },
  cp_phase_2: {
    question: 'Which result is the strongest evidence for “{checkpoint}”?',
    options: [
      { id: 'a', text: 'A completed tutorial with no applied work' },
      { id: 'b', text: 'A working, role-relevant deliverable with decisions and requirements recorded' },
      { id: 'c', text: 'A progress estimate without an artifact' },
      { id: 'd', text: 'A copied example whose behavior is not understood' },
    ],
    correct: 'b',
    explanation: 'A role-relevant deliverable with traceable decisions demonstrates applied learning.',
  },
  cp_phase_3: {
    question: 'How should you verify the work for “{checkpoint}” before calling it complete?',
    options: [
      { id: 'a', text: 'Check only the most common happy path' },
      { id: 'b', text: 'Rely on appearance or intuition instead of criteria' },
      { id: 'c', text: 'Compare it with stated criteria and check normal, boundary, and failure cases' },
      { id: 'd', text: 'Skip review if the first attempt worked' },
    ],
    correct: 'c',
    explanation: 'Verifying stated criteria and edge cases gives stronger evidence than a happy-path check.',
  },
  cp_phase_4: {
    question: 'What makes the outcome of “{checkpoint}” ready to share with a reviewer?',
    options: [
      { id: 'a', text: 'A reproducible result, supporting evidence, key tradeoffs, and known limitations' },
      { id: 'b', text: 'A claim of success with no supporting artifact' },
      { id: 'c', text: 'A polished summary that omits failed attempts and limitations' },
      { id: 'd', text: 'A list of tools used without explaining the outcome' },
    ],
    correct: 'a',
    explanation: 'Reviewers need reproducible evidence and an honest account of tradeoffs and limitations.',
  },
  cp_full_stack_p1: {
    question: 'For “{checkpoint}”, where should authorization for a user-owned record be enforced?',
    options: [
      { id: 'a', text: 'Only in the browser before sending the request' },
      { id: 'b', text: 'At the trusted server or database boundary for every request' },
      { id: 'c', text: 'Only when the user first signs in' },
      { id: 'd', text: 'In a hidden form field supplied by the client' },
    ],
    correct: 'b',
    explanation: 'Authorization must be enforced at a trusted boundary on each request; client-side checks improve UX but cannot protect data.',
  },
  cp_full_stack_p2: {
    question: 'Which design makes “{checkpoint}” easiest to evolve across the UI, API, and database?',
    options: [
      { id: 'a', text: 'A documented request/response contract with server validation and explicit error states' },
      { id: 'b', text: 'Database column names exposed directly as unversioned UI assumptions' },
      { id: 'c', text: 'Different validation rules in each layer with no shared expectations' },
      { id: 'd', text: 'A single success response for valid and invalid requests' },
    ],
    correct: 'a',
    explanation: 'A clear contract and authoritative server validation keep the layers predictable while allowing implementation details to change.',
  },
  cp_full_stack_p3: {
    question: 'When “{checkpoint}” must update related records together, what protects the data from a partial write?',
    options: [
      { id: 'a', text: 'A sequence of independent client requests' },
      { id: 'b', text: 'A UI loading spinner around the writes' },
      { id: 'c', text: 'One database transaction with constraints for the required invariants' },
      { id: 'd', text: 'Retrying every failed statement without checking prior effects' },
    ],
    correct: 'c',
    explanation: 'A transaction makes related changes atomic, while database constraints enforce invariants even under concurrent requests.',
  },
  cp_full_stack_p4: {
    question: 'Which approach best protects “{checkpoint}” when the browser retries after a network timeout?',
    options: [
      { id: 'a', text: 'Assume the original request did not reach the server' },
      { id: 'b', text: 'Use an idempotent operation or idempotency key and verify ownership server-side' },
      { id: 'c', text: 'Disable all server-side duplicate checks' },
      { id: 'd', text: 'Trust a client-supplied owner ID to identify the record' },
    ],
    correct: 'b',
    explanation: 'Retries can repeat a request after an uncertain outcome; idempotency and server-side ownership checks keep the operation safe.',
  },
  cp_frontend_p1: {
    question: 'A React handler in “{checkpoint}” calls setCount(count + 1) three times in one event. What is the reliable way to add three?',
    options: [
      { id: 'a', text: 'Call setCount(count + 1) three times because count changes immediately' },
      { id: 'b', text: 'Use setCount(previous => previous + 1) for each queued increment' },
      { id: 'c', text: 'Mutate count directly and force a render' },
      { id: 'd', text: 'Read the updated count immediately after the first setter call' },
    ],
    correct: 'b',
    explanation: 'React state is a snapshot for the current render; updater functions compose queued changes against the previous queued value.',
  },
  cp_frontend_p2: {
    question: 'Which component behavior is appropriate while rendering “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Start a network request and mutate a module variable during render' },
      { id: 'b', text: 'Produce UI from current props/state and keep side effects in event handlers or effects' },
      { id: 'c', text: 'Change a prop object so a child sees the new value' },
      { id: 'd', text: 'Write to browser storage whenever the component function runs' },
    ],
    correct: 'b',
    explanation: 'Pure rendering is predictable and repeatable; external synchronization belongs in event handlers or effects.',
  },
  cp_frontend_p3: {
    question: 'A sortable list in “{checkpoint}” can insert and remove rows. Which React key should each row use?',
    options: [
      { id: 'a', text: 'A stable unique ID belonging to that data item' },
      { id: 'b', text: 'The current array index in every case' },
      { id: 'c', text: 'A random number generated during render' },
      { id: 'd', text: 'The item text only when it may be duplicated' },
    ],
    correct: 'a',
    explanation: 'Stable IDs let React preserve item identity when a list is reordered, inserted into, or filtered.',
  },
  cp_frontend_p4: {
    question: 'What is the strongest release check for the interactive flow in “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Confirm only that it looks correct with a mouse on one screen size' },
      { id: 'b', text: 'Verify keyboard operation, semantic labels, focus behavior, and responsive states' },
      { id: 'c', text: 'Remove visible focus styles to match the design' },
      { id: 'd', text: 'Use clickable divs without keyboard behavior' },
    ],
    correct: 'b',
    explanation: 'A professional UI must remain usable across input methods, assistive technology, and viewport sizes.',
  },
  cp_backend_p1: {
    question: 'For “{checkpoint}” in a Node.js request handler, what should happen to CPU-heavy or synchronous work?',
    options: [
      { id: 'a', text: 'Run it synchronously for each request so ordering is simple' },
      { id: 'b', text: 'Keep event-loop callbacks short and move expensive computation to an appropriate worker' },
      { id: 'c', text: 'Increase the request timeout and leave the event loop blocked' },
      { id: 'd', text: 'Parse unbounded client input before applying size limits' },
    ],
    correct: 'b',
    explanation: 'A long callback prevents the event loop from serving other clients; bound input and offload expensive work where appropriate.',
  },
  cp_backend_p2: {
    question: 'How should you decide whether an index helps the query in “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Add an index for every column to guarantee fast queries' },
      { id: 'b', text: 'Match indexes to real filters/orderings and inspect the query plan and workload' },
      { id: 'c', text: 'Assume a composite B-tree is equally efficient for every column order' },
      { id: 'd', text: 'Use an index even when the query returns most rows' },
    ],
    correct: 'b',
    explanation: 'Index usefulness depends on the actual workload; multicolumn B-tree indexes are most effective when leading columns are constrained.',
  },
  cp_backend_p3: {
    question: 'If “{checkpoint}” runs at SERIALIZABLE isolation and PostgreSQL returns SQLSTATE 40001, what is the correct recovery?',
    options: [
      { id: 'a', text: 'Continue using values read by the failed transaction' },
      { id: 'b', text: 'Retry only the final SQL statement' },
      { id: 'c', text: 'Abort and retry the complete transaction, including the decisions that led to its statements' },
      { id: 'd', text: 'Ignore the error because the database committed the transaction' },
    ],
    correct: 'c',
    explanation: 'A serialization failure invalidates the transaction; retry the whole unit so its reads and write decisions are consistent.',
  },
  cp_backend_p4: {
    question: 'Which boundary should enforce access to the object used in “{checkpoint}”?',
    options: [
      { id: 'a', text: 'A trusted server/database check that derives identity from the authenticated session' },
      { id: 'b', text: 'A hidden owner field in the request body' },
      { id: 'c', text: 'A route that hides the object ID from the navigation menu' },
      { id: 'd', text: 'A client-side check before rendering the page' },
    ],
    correct: 'a',
    explanation: 'The server must verify identity and ownership for each protected operation; client-side visibility is not authorization.',
  },
  cp_nextjs_p1: {
    question: 'In “{checkpoint}”, which component should own data access that uses a private server credential?',
    options: [
      { id: 'a', text: 'A Server Component or server-only module that never passes the credential to the browser' },
      { id: 'b', text: 'A Client Component so the browser can make requests directly' },
      { id: 'c', text: 'A shared module imported by both server and client code' },
      { id: 'd', text: 'A public environment variable embedded in the bundle' },
    ],
    correct: 'a',
    explanation: 'Keep secrets in server-only code and pass only the minimum data needed to render the client UI.',
  },
  cp_nextjs_p2: {
    question: 'How should “{checkpoint}” invoke a Next.js Server Action that changes protected data?',
    options: [
      { id: 'a', text: 'Trust the form because Server Actions can only be called by rendered pages' },
      { id: 'b', text: 'Validate input and authenticate and authorize the request inside the action' },
      { id: 'c', text: 'Check authorization only when the page initially loads' },
      { id: 'd', text: 'Expose the database credential as an action argument' },
    ],
    correct: 'b',
    explanation: 'A Server Action is a reachable server endpoint; validate inputs and enforce authorization on every invocation.',
  },
  cp_nextjs_p3: {
    question: 'What should “{checkpoint}” do when rendering data that belongs to the signed-in user?',
    options: [
      { id: 'a', text: 'Cache it globally under a shared key for every visitor' },
      { id: 'b', text: 'Read and authorize it on the server, with caching scoped to the data’s privacy and identity' },
      { id: 'c', text: 'Put the user ID in a hidden field and trust it on later requests' },
      { id: 'd', text: 'Fetch it from a Client Component using an admin credential' },
    ],
    correct: 'b',
    explanation: 'User-specific data needs server-side ownership checks and cache behavior that cannot expose one user’s result to another.',
  },
  cp_nextjs_p4: {
    question: 'Which release check best protects the server/client boundary in “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Inspect production output and requests for leaked secrets, then test unauthorized action calls' },
      { id: 'b', text: 'Confirm only that the page renders while signed in as an administrator' },
      { id: 'c', text: 'Rely on TypeScript to prevent every runtime authorization failure' },
      { id: 'd', text: 'Remove input validation because the action is internal code' },
    ],
    correct: 'a',
    explanation: 'Reviewing shipped assets and exercising unauthorized requests validates both secret handling and server-side access control.',
  },
  cp_vue_p1: {
    question: 'In “{checkpoint}”, a Vue ref is read or updated from component JavaScript. Which syntax is correct?',
    options: [
      { id: 'a', text: 'Use ref.value in JavaScript; templates unwrap refs in common rendering expressions' },
      { id: 'b', text: 'Always replace the ref object with a plain value' },
      { id: 'c', text: 'Use ref.value only in templates and omit it in JavaScript' },
      { id: 'd', text: 'Mutate a module-level ref to share state across every SSR request' },
    ],
    correct: 'a',
    explanation: 'Vue refs expose their reactive value through .value in JavaScript, while templates provide ref unwrapping.',
  },
  cp_vue_p2: {
    question: 'What is a safe way to update a reactive object used by “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Replace the reactive object and keep using the old reference' },
      { id: 'b', text: 'Mutate its tracked properties, or use a ref when the whole object must be replaced' },
      { id: 'c', text: 'Destructure every property and expect the detached values to stay reactive' },
      { id: 'd', text: 'Disable reactivity before each update' },
    ],
    correct: 'b',
    explanation: 'Replacing a reactive object or destructuring primitive properties can disconnect the references Vue tracks.',
  },
  cp_vue_p3: {
    question: 'How should “{checkpoint}” avoid leaking state between server-rendered users?',
    options: [
      { id: 'a', text: 'Create request-scoped state and avoid mutable user data in shared module singletons' },
      { id: 'b', text: 'Store the current user in one module-level reactive object' },
      { id: 'c', text: 'Reuse one Pinia store instance for every server request' },
      { id: 'd', text: 'Disable server rendering for all routes by default' },
    ],
    correct: 'a',
    explanation: 'Server processes handle multiple users; per-request state prevents one render from observing another user’s data.',
  },
  cp_vue_p4: {
    question: 'What is the strongest check for the Nuxt flow in “{checkpoint}”?',
    options: [
      { id: 'a', text: 'Verify only the client-side happy path in development' },
      { id: 'b', text: 'Test hydration, navigation, error/loading states, keyboard access, and production rendering' },
      { id: 'c', text: 'Suppress hydration warnings without investigating their cause' },
      { id: 'd', text: 'Use browser-only globals during server setup and rely on retries' },
    ],
    correct: 'b',
    explanation: 'SSR applications need coverage across server rendering, hydration, interaction, failures, and accessibility.',
  },
  cp_rust_p1: {
    question: 'In “{checkpoint}”, what does borrowing a value through a shared reference allow?',
    options: [
      { id: 'a', text: 'Read the value without taking ownership, while the borrow rules prevent conflicting mutation' },
      { id: 'b', text: 'Free the value when the reference leaves scope' },
      { id: 'c', text: 'Create any number of simultaneous mutable references' },
      { id: 'd', text: 'Keep using the value after its owner has been dropped' },
    ],
    correct: 'a',
    explanation: 'A reference borrows rather than owns data; Rust’s aliasing rules prevent invalid simultaneous access.',
  },
  cp_rust_p2: {
    question: 'Which rule should “{checkpoint}” follow when mutating borrowed data?',
    options: [
      { id: 'a', text: 'Allow many mutable references if each is in a different function' },
      { id: 'b', text: 'Use either one mutable reference or any number of shared references for the same data at a time' },
      { id: 'c', text: 'Return references to local values after the function ends' },
      { id: 'd', text: 'Use unsafe code whenever the borrow checker reports a conflict' },
    ],
    correct: 'b',
    explanation: 'Rust enforces exclusive mutable access or shared immutable access so references remain valid and race-free.',
  },
  cp_rust_p3: {
    question: 'How should “{checkpoint}” propagate a fallible operation that returns Result?',
    options: [
      { id: 'a', text: 'Discard the error and return a fabricated success value' },
      { id: 'b', text: 'Use ? when the enclosing function can return a compatible error, then handle it at the appropriate boundary' },
      { id: 'c', text: 'Unwrap every result in production code' },
      { id: 'd', text: 'Convert every error into a panic regardless of recoverability' },
    ],
    correct: 'b',
    explanation: 'The ? operator propagates errors through Result-returning functions; callers can then handle failures deliberately.',
  },
  cp_rust_p4: {
    question: 'Which release approach best supports “{checkpoint}” as a reliable Rust service?',
    options: [
      { id: 'a', text: 'Run formatting, compiler and lint checks, tests, and review unsafe or panic paths' },
      { id: 'b', text: 'Ship after it compiles once on a developer machine' },
      { id: 'c', text: 'Ignore clippy and test failures if the binary starts' },
      { id: 'd', text: 'Use unwrap for untrusted input to reduce branching' },
    ],
    correct: 'a',
    explanation: 'A repeatable quality gate catches correctness and maintainability issues before deployment, including risky failure paths.',
  },
  cp_dotnet_p1: {
    question: 'In “{checkpoint}”, what is the appropriate pattern for naturally asynchronous I/O?',
    options: [
      { id: 'a', text: 'Use async and await through the call chain instead of blocking a worker thread' },
      { id: 'b', text: 'Call .Result on every Task to simplify control flow' },
      { id: 'c', text: 'Wrap synchronous blocking I/O in Task.Run in every case' },
      { id: 'd', text: 'Mark a method async even though it performs no asynchronous work' },
    ],
    correct: 'a',
    explanation: 'Awaiting asynchronous I/O releases the thread while work is pending and avoids sync-over-async blocking.',
  },
  cp_dotnet_p2: {
    question: 'How should “{checkpoint}” authorize an operation on a database resource?',
    options: [
      { id: 'a', text: 'Use only a controller attribute before loading the resource' },
      { id: 'b', text: 'Load the resource, then perform a resource-based authorization check against that specific object' },
      { id: 'c', text: 'Trust a role name supplied by the request body' },
      { id: 'd', text: 'Hide the resource link in the UI for unauthorized users' },
    ],
    correct: 'b',
    explanation: 'Resource-based authorization depends on the loaded object, so the policy must be evaluated after retrieving that resource.',
  },
  cp_dotnet_p3: {
    question: 'What is a sound Entity Framework Core approach for “{checkpoint}” read queries?',
    options: [
      { id: 'a', text: 'Load every column and track every entity even for a read-only summary' },
      { id: 'b', text: 'Project only needed fields and use no-tracking queries when the results will not be edited' },
      { id: 'c', text: 'Keep one DbContext instance alive for the entire application lifetime' },
      { id: 'd', text: 'Run parallel operations on the same DbContext instance' },
    ],
    correct: 'b',
    explanation: 'Projection and no-tracking reads reduce unnecessary work; DbContext instances are intended for short units of work.',
  },
  cp_dotnet_p4: {
    question: 'Which service design best protects “{checkpoint}” in production?',
    options: [
      { id: 'a', text: 'Validate input, authorize the resource, propagate cancellation, and observe failures' },
      { id: 'b', text: 'Catch every exception and return success so clients do not see errors' },
      { id: 'c', text: 'Use synchronous database calls inside asynchronous request handlers' },
      { id: 'd', text: 'Trust client-side validation as the only input check' },
    ],
    correct: 'a',
    explanation: 'Production request paths should validate untrusted input, enforce resource access, respect cancellation, and handle failures explicitly.',
  },
  ...domainQuizTemplates,
} as const;

function createQuizFromTemplate(
  templateId: CheckpointQuizTemplateId,
  taskId: string,
  title: string,
  prefix: 'demo_quiz_' | 'local_quiz_'
): TaskQuiz {
  const template = demoQuizTemplates[templateId];
  const correctOpt = template.options.find((opt) => opt.id === template.correct) || template.options[0];
  const distractorTexts = template.options
    .filter((opt) => opt.id !== template.correct)
    .map((opt) => opt.text);
  const shuffledOptions = buildShuffledOptions(
    {
      question: template.question,
      correctText: correctOpt.text,
      distractors: [
        distractorTexts[0] || 'Skip validation',
        distractorTexts[1] || 'Assume success without checks',
        distractorTexts[2] || 'Ignore error cases',
      ],
      explanation: template.explanation,
    },
    `${taskId}:${templateId}`
  );
  return {
    id: `${prefix}${taskId}`,
    task_id: taskId,
    question: template.question.replace('{checkpoint}', title),
    options: shuffledOptions,
    explanation: template.explanation,
  };
}

export function attachDemoCheckpointQuizzes(
  tasks: Task[],
  milestones: Milestone[] = [],
  roleTitle = 'Career Pilot',
  category: CareerCategory = 'Software & Web'
): Task[] {
  const milestoneById = new Map(milestones.map((m, idx) => [m.id, { milestone: m, index: idx }]));
  return tasks.map((task) => {
    if (task.type !== 'Checkpoint') return task;
    const mInfo = milestoneById.get(task.milestone_id);
    const stageTasks = tasks.filter((t) => t.milestone_id === task.milestone_id);
    if (mInfo) {
      const smart = buildSmartCheckpointQuiz({
        task,
        milestone: mInfo.milestone,
        stageTasks,
        roleTitle,
        category,
        stageIndex: mInfo.index,
        totalStages: Math.max(1, milestones.length),
      });
      return {
        ...task,
        quiz: {
          ...smart,
          id: `demo_quiz_${task.id}`,
        },
      };
    }
    if (!task.quiz_template_id) return task;
    const fallbackBase = createQuizFromTemplate(
      task.quiz_template_id as CheckpointQuizTemplateId,
      task.id,
      task.title,
      'demo_quiz_'
    );
    const smartFallback = buildSmartCheckpointQuiz({
      task: { ...task, quiz: { ...fallbackBase, id: `demo_quiz_${task.id}` } },
      roleTitle,
      category,
      stageIndex: 0,
      totalStages: 4,
    });
    return {
      ...task,
      quiz: {
        ...fallbackBase,
        questions: smartFallback.questions,
      },
    };
  });
}

/**
 * Resolve a multi-question smart checkpoint quiz tailored to the stage's tasks & skills,
 * preserving any server-backed `task_quizzes` question for DB verification.
 */
export function createFallbackCheckpointQuiz(
  taskId: string,
  title: string,
  roleTitle: string,
  milestoneIndex: number,
  totalMilestones: number,
  category?: CareerCategory,
  explicitTemplateId?: string,
  milestone?: Milestone,
  stageTasks?: Task[],
  existingTask?: Task
): TaskQuiz {
  const curated = findCuratedCareerBlueprint(roleTitle);
  const resolvedSlug = curated?.slug || roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const resolvedCategory = category || curated?.category || 'Software & Web';
  const defaultTemplateId = getCheckpointQuizTemplateId(
    resolvedSlug,
    Math.max(0, milestoneIndex),
    Math.max(1, totalMilestones),
    resolvedCategory
  );
  const templateId =
    explicitTemplateId && Object.prototype.hasOwnProperty.call(demoQuizTemplates, explicitTemplateId)
      ? (explicitTemplateId as CheckpointQuizTemplateId)
      : defaultTemplateId;

  const baseTask: Task = existingTask ?? {
    id: taskId,
    milestone_id: milestone?.id || '',
    user_id: '',
    title,
    subject: milestone?.title || title,
    type: 'Checkpoint',
    due_date: '',
    est_minutes: 45,
    progress_pct: 0,
  };

  if (milestone || (stageTasks && stageTasks.length > 0) || existingTask?.quiz) {
    return buildSmartCheckpointQuiz({
      task: baseTask,
      milestone,
      stageTasks,
      roleTitle,
      category: resolvedCategory,
      stageIndex: Math.max(0, milestoneIndex),
      totalStages: Math.max(1, totalMilestones),
    });
  }

  return createQuizFromTemplate(templateId, taskId, title, 'local_quiz_');
}
