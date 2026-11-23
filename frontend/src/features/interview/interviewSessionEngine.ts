import type { CareerCategory } from '../roadmap/careerCatalog';
import {
  getQuestionCoachingHint,
  getQuestionFollowUpProbes,
  getRoleTailoredInterviewQuestions,
  scoreDeterministicInterviewAnswer,
  type CuratedInterviewQuestion,
  type EvaluatedInterviewAttempt,
} from './curatedInterviewCatalog';

export type InterviewFocusMode = 'Mixed' | 'Behavioral' | 'Technical' | 'System Design';
export type DifficultyPreference = 'Adaptive' | 'Junior' | 'Mid' | 'Senior';

export interface InterviewerPersona {
  name: string;
  roleTitle: string;
  toneSummary: string;
}

export interface QuestionEvaluationSummary {
  questionId: string;
  questionText: string;
  round: CuratedInterviewQuestion['round'];
  difficulty: CuratedInterviewQuestion['difficulty'];
  score: number;
  signalLabel: 'Strong Signal' | 'Solid Foundation' | 'Developing';
  strengths: string[];
  growthTip: string;
  matchedConcepts: string[];
  missedConcepts: string[];
  modelAnswer: string;
  aiCritique?: string;
  attempt: EvaluatedInterviewAttempt;
}

export interface ConversationTurn {
  id: string;
  speaker: 'interviewer' | 'candidate' | 'coach';
  kind:
    | 'greeting'
    | 'question'
    | 'followup'
    | 'clarification'
    | 'answer'
    | 'evaluation'
    | 'debrief';
  text: string;
  timestamp: string;
  questionId?: string;
  badge?: string;
  interviewer?: InterviewerPersona;
  evaluation?: QuestionEvaluationSummary;
  debrief?: SessionDebrief;
}

export interface CandidateMemory {
  firstName?: string;
  targetRole: string;
  experienceLevel?: 'beginner' | 'switcher' | 'junior' | 'mid';
  roleSkills?: string[];
  warmupSummary?: string;
  mentionedTools: string[];
}

export interface SessionDebrief {
  overallScore: number;
  readinessLabel: 'Strong Hire Signal' | 'Solid Progress' | 'Promising Foundation' | 'Warm-Up Complete';
  summaryNote: string;
  dimensions: Array<{
    label: string;
    score: number;
    comment: string;
  }>;
  topStrengths: string[];
  priorityImprovements: string[];
  questionsCompleted: number;
}

export interface ResponseSignals {
  wordCount: number;
  isUncertain: boolean;
  isClarificationRequest: boolean;
  mentionedTools: string[];
  metrics: string[];
  hasContext: boolean;
  hasDecisionsOrTradeoffs: boolean;
  hasEdgeCaseOrFailure: boolean;
  hasValidationOrImpact: boolean;
  hasPersonalOwnership: boolean;
  onlyTeamPronouns: boolean;
}

const KNOWN_TECH_CONCEPTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\breact\b/i, label: 'React' },
  { pattern: /\bnext(?:\.?js)?\b/i, label: 'Next.js' },
  { pattern: /\btypescript\b/i, label: 'TypeScript' },
  { pattern: /\bjavascript\b/i, label: 'JavaScript' },
  { pattern: /\bnode(?:\.?js)?\b/i, label: 'Node.js' },
  { pattern: /\bpython\b/i, label: 'Python' },
  { pattern: /\bfastapi\b/i, label: 'FastAPI' },
  { pattern: /\bdjango\b/i, label: 'Django' },
  { pattern: /\bsqlalchemy\b/i, label: 'SQLAlchemy' },
  { pattern: /\bpydantic\b/i, label: 'Pydantic' },
  { pattern: /\bpytest\b/i, label: 'PyTest' },
  { pattern: /\basyncio\b/i, label: 'Asyncio' },
  { pattern: /\bcelery\b/i, label: 'Celery' },
  { pattern: /\bgil\b|\bmultiprocessing\b/i, label: 'Python concurrency' },
  { pattern: /\bgolang\b|\bgo\b/i, label: 'Go' },
  { pattern: /\brust\b/i, label: 'Rust' },
  { pattern: /\bjava\b/i, label: 'Java' },
  { pattern: /\bpostgres(?:ql)?\b/i, label: 'PostgreSQL' },
  { pattern: /\bmysql\b/i, label: 'MySQL' },
  { pattern: /\bsql\b/i, label: 'SQL' },
  { pattern: /\bredis\b/i, label: 'Redis' },
  { pattern: /\bkafka\b/i, label: 'Kafka' },
  { pattern: /\bsqs\b|\brabbitmq\b|\bqueue\b/i, label: 'async queues' },
  { pattern: /\bdocker\b/i, label: 'Docker' },
  { pattern: /\bkubernetes\b|\bk8s\b/i, label: 'Kubernetes' },
  { pattern: /\bterraform\b/i, label: 'Terraform' },
  { pattern: /\baws\b|\bgcp\b|\bazure\b/i, label: 'cloud infrastructure' },
  { pattern: /\bgraphql\b/i, label: 'GraphQL' },
  { pattern: /\brest\b|\bapi\b/i, label: 'API design' },
  { pattern: /\bwebhook/i, label: 'webhooks' },
  { pattern: /\boauth|\bjwt\b|\brbac\b|\babac\b|\brls\b/i, label: 'auth & access control' },
  { pattern: /\bsupabase\b/i, label: 'Supabase' },
  { pattern: /\bci\/cd\b|\bgithub actions\b|\bpipeline\b/i, label: 'CI/CD pipelines' },
  { pattern: /\bcach(?:e|ing)\b/i, label: 'caching' },
  { pattern: /\bindex(?:es|ing)?\b/i, label: 'indexing' },
  { pattern: /\bidempoten/i, label: 'idempotency' },
  { pattern: /\brate limit/i, label: 'rate limiting' },
  { pattern: /\bcanary\b|\bfeature flag/i, label: 'progressive rollouts' },
  { pattern: /\bprometheus\b|\bgrafana\b|\bopentelemetry\b|\bmonitor/i, label: 'observability' },
  { pattern: /\brag\b|\bembedding|\bllm\b|\bfine[- ]tun/i, label: 'LLM/RAG architecture' },
  { pattern: /\bprofiler\b|\bdevtools\b|\bexplain analyze\b/i, label: 'profiling' },
  { pattern: /\bvirtualiz/i, label: 'list virtualization' },
  { pattern: /\bfigma\b|\bdesign system\b|\baccessibility\b/i, label: 'UI/UX systems' },
  { pattern: /\bplaywright\b|\bcypress\b|\bjest\b|\bvitest\b|\be2e\b/i, label: 'automated testing' },
];

export function extractMentionedTools(text: string): string[] {
  const found: string[] = [];
  for (const item of KNOWN_TECH_CONCEPTS) {
    if (item.pattern.test(text) && !found.includes(item.label)) {
      found.push(item.label);
    }
  }
  return found;
}

export function extractMetrics(text: string): string[] {
  const matches = text.match(
    /\b\d+(?:\.\d+)?\s*(?:%|(?:ms|s|sec|seconds|mins|minutes|hours|hrs|days|x|k|m|gb|mb|rps|qps)\b)/gi
  );
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.trim()))].slice(0, 4);
}

export function getInterviewerPersona(
  round: CuratedInterviewQuestion['round'] | 'Warmup',
  targetRole: string
): InterviewerPersona {
  if (round === 'Behavioral' || round === 'Warmup') {
    return {
      name: 'Maya Chen',
      roleTitle: `Hiring Manager · ${targetRole}`,
      toneSummary: 'Warm, structured, focused on real ownership and impact',
    };
  }
  if (round === 'System Design') {
    return {
      name: 'Elena Brooks',
      roleTitle: 'Principal Systems Architect',
      toneSummary: 'Collaborative, probing scale, failure modes, and tradeoffs',
    };
  }
  return {
    name: 'Devon Patel',
    roleTitle: `Staff ${targetRole}`,
    toneSummary: 'Practical, hands-on debugging, tradeoffs, and edge cases',
  };
}

const HONORIFIC_PREFIXES = new Set([
  'md',
  'mr',
  'mrs',
  'ms',
  'miss',
  'dr',
  'prof',
  'engr',
  'sir',
  'shri',
]);

export function extractFirstName(fullName?: string): string | undefined {
  if (!fullName) return undefined;
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;
  if (tokens.some((token) => /@/.test(token))) return undefined;

  let chosen = tokens[0];
  if (tokens.length > 1) {
    const firstNormalized = chosen.replace(/\.+$/, '').toLowerCase();
    if (HONORIFIC_PREFIXES.has(firstNormalized)) {
      chosen = tokens[1];
    }
  }
  const cleaned = chosen.replace(/\.+$/, '');
  if (!cleaned || cleaned.length < 2) return undefined;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Builds an ordered multi-question loop calibrated to the candidate's target role,
 * category, focus mode, and experience baseline.
 */
export function buildInterviewLoopQueue(options: {
  category: CareerCategory;
  targetRole: string;
  focusMode: InterviewFocusMode;
  difficulty: DifficultyPreference;
  experienceLevel?: 'beginner' | 'switcher' | 'junior' | 'mid';
  roleSkills?: string[];
  remoteQuestions?: CuratedInterviewQuestion[];
  count?: number;
}): CuratedInterviewQuestion[] {
  const { category, targetRole, focusMode, difficulty, experienceLevel, roleSkills = [], remoteQuestions = [], count = 4 } = options;

  const curated = getRoleTailoredInterviewQuestions(
    category,
    targetRole,
    focusMode === 'Mixed' ? undefined : focusMode,
    roleSkills
  );

  // Deduplicate keeping curated/role-tailored priority, appending unique DB questions if present
  const seen = new Set(curated.map((q) => q.id));
  const combined = [...curated];
  for (const rq of remoteQuestions) {
    if (!seen.has(rq.id)) {
      seen.add(rq.id);
      combined.push(rq);
    }
  }

  let pool = focusMode === 'Mixed' ? combined : combined.filter((q) => q.round === focusMode);
  if (pool.length === 0) pool = combined;

  const targetDiff: 'Junior' | 'Mid' | 'Senior' =
    difficulty !== 'Adaptive'
      ? difficulty
      : experienceLevel === 'beginner' || experienceLevel === 'switcher'
        ? 'Junior'
        : experienceLevel === 'junior'
          ? 'Mid'
          : 'Mid';

  // For Mixed loops, lead with core Technical craft, then System Design, Behavioral ownership, and a deeper Technical round
  if (focusMode === 'Mixed') {
    const orderedRounds: Array<CuratedInterviewQuestion['round']> = ['Technical', 'System Design', 'Behavioral', 'Technical'];
    const picked: CuratedInterviewQuestion[] = [];
    const usedIds = new Set<string>();

    for (const round of orderedRounds) {
      if (picked.length >= count) break;
      const roundMatches = pool.filter((q) => q.round === round && !usedIds.has(q.id));
      const exactDiff = roundMatches.find((q) => q.difficulty === targetDiff) ?? roundMatches[0];
      if (exactDiff) {
        usedIds.add(exactDiff.id);
        picked.push(exactDiff);
      }
    }

    for (const q of pool) {
      if (picked.length >= count) break;
      if (!usedIds.has(q.id)) {
        usedIds.add(q.id);
        picked.push(q);
      }
    }
    return picked;
  }

  // Focused round: sort by difficulty match while preserving role relevance
  const diffSorted = [...pool].sort((a, b) => {
    const aExact = a.difficulty === targetDiff ? 0 : 1;
    const bExact = b.difficulty === targetDiff ? 0 : 1;
    return aExact - bExact;
  });
  return diffSorted.slice(0, count);
}

export function buildOpeningGreetingTurn(memory: CandidateMemory, focusMode: InterviewFocusMode): ConversationTurn {
  const persona = getInterviewerPersona('Warmup', memory.targetRole);
  const namePart = memory.firstName ? `Hi ${memory.firstName}` : 'Hi there';
  const topSkills = memory.roleSkills && memory.roleSkills.length > 0
    ? ` (${memory.roleSkills.slice(0, 3).join(', ')})`
    : '';
  const focusDescription =
    focusMode === 'Mixed'
      ? `practical ${memory.targetRole}${topSkills} scenarios, system architecture tradeoffs, and real project ownership`
      : `${focusMode.toLowerCase()} scenarios tailored to ${memory.targetRole}${topSkills}`;

  return {
    id: `turn-greeting-${crypto.randomUUID().slice(0, 8)}`,
    speaker: 'interviewer',
    kind: 'greeting',
    timestamp: new Date().toISOString(),
    badge: 'Warm-up',
    interviewer: persona,
    text: `${namePart}, welcome to your ${memory.targetRole} interview room. I'm Maya, and today's loop covers ${focusDescription}. Tell me in 2–3 sentences about a recent project or system you built—or click "Start Question 1" anytime to dive straight into the first technical scenario.`,
  };
}

export function buildQuestionIntroTurn(options: {
  question: CuratedInterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  memory: CandidateMemory;
  transitionFromWarmup?: boolean;
  previousTurnAck?: string;
}): ConversationTurn {
  const { question, questionIndex, totalQuestions, memory, transitionFromWarmup, previousTurnAck } = options;
  const persona = getInterviewerPersona(question.round, memory.targetRole);

  let prefix = '';
  if (transitionFromWarmup && memory.warmupSummary) {
    const toolsText =
      memory.mentionedTools.length > 0
        ? ` — especially your experience around ${memory.mentionedTools.slice(0, 2).join(' and ')}`
        : '';
    prefix = `Thanks for sharing that context${toolsText}. That gives me a clear picture of how you work. Let's start with our first scenario:\n\n`;
  } else if (previousTurnAck) {
    prefix = `${previousTurnAck}\n\n`;
  } else if (questionIndex === 0) {
    const namePart = memory.firstName ? `${memory.firstName}, ` : '';
    prefix = `Great — let's jump right in. ${namePart}here is our first question for ${memory.targetRole}:\n\n`;
  } else {
    const bridges = [
      "Alright, let's shift gears slightly for the next one:\n\n",
      "Let's move on to another angle we evaluate for this role:\n\n",
      "Good, let's look at one more realistic scenario:\n\n",
    ];
    prefix = bridges[(questionIndex - 1) % bridges.length];
  }

  return {
    id: `turn-q-${question.id}-${crypto.randomUUID().slice(0, 6)}`,
    speaker: 'interviewer',
    kind: 'question',
    timestamp: new Date().toISOString(),
    questionId: question.id,
    badge: `Q${questionIndex + 1}/${totalQuestions} · ${question.round}`,
    interviewer: persona,
    text: `${prefix}${question.question}`,
  };
}

export function analyzeCandidateResponse(text: string): ResponseSignals {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = trimmed.toLowerCase();

  const isUncertain =
    /\b(i don't know|i do not know|not sure|no idea|unsure|i forgot|can't remember|skip|pass)\b/i.test(lower) ||
    wordCount < 12;

  const isClarificationRequest =
    /\b(can you clarify|could you clarify|what do you mean|clarify|give me a hint|hint|should i assume|are there constraints)\b/i.test(
      lower
    ) || (trimmed.endsWith('?') && wordCount < 24);

  const mentionedTools = extractMentionedTools(trimmed);
  const metrics = extractMetrics(trimmed);

  const hasContext = /\b(when|during|while|situation|context|project|team|service|users|endpoint|dashboard|traffic|legacy)\b/i.test(
    lower
  );
  const hasDecisionsOrTradeoffs =
    /\b(because|instead of|tradeoff|trade-off|versus|vs|chose|decided|alternative|downside|cost|balance|prefer)\b/i.test(
      lower
    );
  const hasEdgeCaseOrFailure =
    /\b(if|when it fails|fail|failure|timeout|retry|fallback|rollback|race|stale|edge case|deadlock|spike|duplicate|error)\b/i.test(
      lower
    );
  const hasValidationOrImpact =
    metrics.length > 0 ||
    /\b(measured|monitor|metric|latency|tested|verified|reduced|improved|saved|increased|dropped|slo|alert|feedback)\b/i.test(
      lower
    );
  const hasPersonalOwnership = /\b(i built|i led|i designed|i implemented|i debugged|i wrote|i profiled|i added|my approach|i would)\b/i.test(
    lower
  );
  const hasWe = /\bwe\b/i.test(lower);
  const onlyTeamPronouns = hasWe && !/\bi\b/i.test(lower);

  return {
    wordCount,
    isUncertain,
    isClarificationRequest,
    mentionedTools,
    metrics,
    hasContext,
    hasDecisionsOrTradeoffs,
    hasEdgeCaseOrFailure,
    hasValidationOrImpact,
    hasPersonalOwnership,
    onlyTeamPronouns,
  };
}

export interface NextTurnOutcome {
  action: 'ask_followup' | 'clarify' | 'complete_question';
  interviewerTurn: ConversationTurn;
  evaluation?: QuestionEvaluationSummary;
}

/**
 * Evaluates a candidate's latest reply in context of the active question and
 * previous turns for that question, returning either a natural contextual
 * human follow-up probe, a helpful clarification, or a grounded question wrap-up.
 */
export function generateInterviewerTurn(options: {
  question: CuratedInterviewQuestion;
  previousUserTurnsForQuestion: string[];
  latestAnswer: string;
  followUpCount: number;
  memory: CandidateMemory;
}): NextTurnOutcome {
  const { question, previousUserTurnsForQuestion, latestAnswer, followUpCount, memory } = options;
  const persona = getInterviewerPersona(question.round, memory.targetRole);
  const latestSignals = analyzeCandidateResponse(latestAnswer);
  const combinedAnswer = [...previousUserTurnsForQuestion, latestAnswer].join('\n\n').trim();
  const combinedSignals = analyzeCandidateResponse(combinedAnswer);
  const probes = getQuestionFollowUpProbes(question, memory.targetRole);

  // 1. Candidate asked for clarification or a hint -> clarify naturally without penalizing turn count
  if (latestSignals.isClarificationRequest) {
    const hint = getQuestionCoachingHint(question, memory.targetRole);
    return {
      action: 'clarify',
      interviewerTurn: {
        id: `turn-clarify-${crypto.randomUUID().slice(0, 8)}`,
        speaker: 'interviewer',
        kind: 'clarification',
        timestamp: new Date().toISOString(),
        questionId: question.id,
        badge: 'Clarification',
        interviewer: persona,
        text: `Good question to ask upfront. ${hint} Take it step by step—what comes to mind first?`,
      },
    };
  }

  // 2. First turn and candidate is stuck / very brief -> warm human scaffold
  if (followUpCount === 0 && latestSignals.isUncertain) {
    const hint = getQuestionCoachingHint(question, memory.targetRole);
    return {
      action: 'ask_followup',
      interviewerTurn: {
        id: `turn-nudge-${crypto.randomUUID().slice(0, 8)}`,
        speaker: 'interviewer',
        kind: 'followup',
        timestamp: new Date().toISOString(),
        questionId: question.id,
        badge: 'Follow-up',
        interviewer: persona,
        text: `No worries—let's break this down together so it's easier to reason through. ${hint} Even a rough starting instinct is totally fine: where would you inspect or start first?`,
      },
    };
  }

  // Build specific acknowledgment referencing what the candidate actually wrote
  const buildSpecificAck = (sig: ResponseSignals): string => {
    const tool = sig.mentionedTools[0];
    const metric = sig.metrics[0];
    if (tool && metric) {
      return `Got it — tying ${tool} directly to that ${metric} impact makes the story very concrete.`;
    }
    if (tool) {
      return `Makes sense — bringing in ${tool} is a practical way to tackle that part of the problem.`;
    }
    if (metric) {
      return `Appreciate the concrete numbers (${metric}) — that helps anchor the scale of the outcome.`;
    }
    if (sig.hasPersonalOwnership) {
      return 'Thanks for walking cleanly through how you approached that.';
    }
    return 'Got it, I see the direction you are taking.';
  };

  // 3. First substantive turn -> ask ONE contextual follow-up probe referencing what they said or missed
  if (followUpCount === 0) {
    const ack = buildSpecificAck(latestSignals);
    const toolRef = latestSignals.mentionedTools[0];
    let probe = probes[0];

    if (question.round === 'Behavioral' && latestSignals.onlyTeamPronouns) {
      probe =
        'I hear the team moved quickly on that — what specific decision or piece of execution did you personally drive end-to-end?';
    } else if (question.round === 'Behavioral' && !latestSignals.hasValidationOrImpact) {
      probe =
        'Once that shipped, how did you know it genuinely solved the problem for users or your team? Any metric or feedback signal you watched?';
    } else if (!latestSignals.hasDecisionsOrTradeoffs && toolRef) {
      probe = `Out of curiosity, why did you reach for ${toolRef} specifically over a simpler alternative, and what tradeoff did that bring?`;
    } else if (!latestSignals.hasEdgeCaseOrFailure && question.round !== 'Behavioral') {
      probe = toolRef
        ? `When ${toolRef} hits an unexpected failure, timeout, or bad input under load, how does your approach degrade safely?`
        : probes[0];
    } else if (probes[1]) {
      probe = probes[1];
    }

    return {
      action: 'ask_followup',
      interviewerTurn: {
        id: `turn-followup-${crypto.randomUUID().slice(0, 8)}`,
        speaker: 'interviewer',
        kind: 'followup',
        timestamp: new Date().toISOString(),
        questionId: question.id,
        badge: 'Follow-up probe',
        interviewer: persona,
        text: `${ack} ${probe}`,
      },
    };
  }

  // 4. Follow-up answered -> evaluate full combined response & close question cleanly
  const evaluation = evaluateQuestionExchange({
    question,
    combinedAnswer,
    signals: combinedSignals,
    targetRole: memory.targetRole,
  });

  return {
    action: 'complete_question',
    evaluation,
    interviewerTurn: {
      id: `turn-eval-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'coach',
      kind: 'evaluation',
      timestamp: new Date().toISOString(),
      questionId: question.id,
      badge: `${evaluation.signalLabel} · ${evaluation.score}%`,
      interviewer: persona,
      evaluation,
      text: `${buildSpecificAck(latestSignals)} Thanks — I have a clear signal on this one.`,
    },
  };
}

export function evaluateQuestionExchange(options: {
  question: CuratedInterviewQuestion;
  combinedAnswer: string;
  signals?: ResponseSignals;
  targetRole: string;
}): QuestionEvaluationSummary {
  const { question, combinedAnswer, targetRole } = options;
  const signals = options.signals ?? analyzeCandidateResponse(combinedAnswer);
  const attempt = scoreDeterministicInterviewAnswer(question, combinedAnswer);

  // Calibrate rubric & score for natural human phrasing rather than rigid buzzword matching alone
  const effectiveRubric = {
    situation: attempt.rubric_feedback.situation || signals.hasContext,
    task: attempt.rubric_feedback.task || signals.hasDecisionsOrTradeoffs || signals.mentionedTools.length > 0,
    action:
      attempt.rubric_feedback.action ||
      signals.hasPersonalOwnership ||
      signals.hasEdgeCaseOrFailure ||
      signals.wordCount >= 28,
    result: attempt.rubric_feedback.result || signals.hasValidationOrImpact,
  };

  const structurePoints =
    (effectiveRubric.situation ? 15 : 0) +
    (effectiveRubric.task ? 15 : 0) +
    (effectiveRubric.action ? 20 : 0) +
    (effectiveRubric.result ? 20 : 0);

  const keywordRatio = attempt.matched_keywords.length / Math.max(1, attempt.expected_keywords.length);
  const keywordPoints = Math.round(keywordRatio * 20);
  const naturalDepthPoints = Math.min(
    10,
    (signals.hasDecisionsOrTradeoffs ? 4 : 0) +
      (signals.hasEdgeCaseOrFailure ? 3 : 0) +
      (signals.mentionedTools.length >= 2 ? 3 : signals.mentionedTools.length === 1 ? 1 : 0)
  );

  const calibratedScore = signals.isUncertain && signals.wordCount < 14
    ? Math.min(20, structurePoints)
    : Math.min(100, structurePoints + keywordPoints + naturalDepthPoints);

  const calibratedAttempt: EvaluatedInterviewAttempt = {
    ...attempt,
    score: calibratedScore,
    rubric_feedback: effectiveRubric,
  };

  const missedConcepts = attempt.expected_keywords.filter((kw) => !attempt.matched_keywords.includes(kw));

  const strengths: string[] = [];
  if (signals.mentionedTools.length > 0) {
    strengths.push(`Grounded the discussion in concrete tools/concepts (${signals.mentionedTools.slice(0, 3).join(', ')}).`);
  }
  if (effectiveRubric.situation && effectiveRubric.action) {
    strengths.push(
      question.round === 'Behavioral'
        ? 'Clear narrative arc connecting context directly to your hands-on actions.'
        : 'Structured technical explanation tying constraints to concrete engineering steps.'
    );
  }
  if (signals.hasDecisionsOrTradeoffs) {
    strengths.push('Explained reasoning and tradeoffs rather than listing buzzwords.');
  }
  if (signals.hasValidationOrImpact) {
    strengths.push(
      signals.metrics.length > 0
        ? `Quantified outcomes cleanly (${signals.metrics.join(', ')}).`
        : 'Connected engineering work back to verification and measurable impact.'
    );
  }
  if (strengths.length === 0) {
    strengths.push('Engaged directly with the prompt and kept the response concise.');
  }

  let growthTip = '';
  if (signals.wordCount < 25) {
    growthTip = 'Walk through one real example step by step—brief context, exact mechanism you chose, and how you verified it worked.';
  } else if (signals.onlyTeamPronouns && question.round === 'Behavioral') {
    growthTip = 'Switch from "we" to "I" when describing key decisions so the interviewer clearly sees your personal ownership.';
  } else if (!signals.hasValidationOrImpact) {
    growthTip = 'Close with how you validated success in practice (metrics, latency change, error reduction, or user feedback).';
  } else if (!signals.hasDecisionsOrTradeoffs) {
    growthTip = `Mention one alternative you considered and why your chosen approach fits ${targetRole} constraints better.`;
  } else if (missedConcepts.length > 0) {
    growthTip = `Strong ${targetRole} candidates also weave in ${missedConcepts.slice(0, 2).join(' and ')} when wrapping up.`;
  } else {
    growthTip = 'Tighten pacing slightly so your sharpest architectural decision and final outcome land in the first 60 seconds.';
  }

  const signalLabel: QuestionEvaluationSummary['signalLabel'] =
    calibratedScore >= 75 ? 'Strong Signal' : calibratedScore >= 52 ? 'Solid Foundation' : 'Developing';

  return {
    questionId: question.id,
    questionText: question.question,
    round: question.round,
    difficulty: question.difficulty,
    score: calibratedScore,
    signalLabel,
    strengths,
    growthTip,
    matchedConcepts: attempt.matched_keywords,
    missedConcepts,
    modelAnswer: question.model_answer,
    attempt: calibratedAttempt,
  };
}

export function buildSessionDebrief(
  evaluations: QuestionEvaluationSummary[],
  memory: CandidateMemory
): SessionDebrief {
  if (evaluations.length === 0) {
    return {
      overallScore: 0,
      readinessLabel: 'Warm-Up Complete',
      summaryNote: `You kicked off a ${memory.targetRole} session${memory.warmupSummary ? ' and shared helpful background context' : ''}. Complete at least one question to generate a full hiring-manager debrief.`,
      dimensions: [
        { label: 'Structure & Clarity', score: 0, comment: 'Answer 1+ question to score.' },
        { label: 'Role & Technical Depth', score: 0, comment: 'Answer 1+ question to score.' },
        { label: 'Evidence & Tradeoffs', score: 0, comment: 'Answer 1+ question to score.' },
      ],
      topStrengths: ['Completed session setup and warm-up orientation.'],
      priorityImprovements: ['Complete at least one Behavioral or Technical scenario end-to-end.'],
      questionsCompleted: 0,
    };
  }

  const avgScore = Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length);

  const structureScores = evaluations.map((e) => {
    const rb = e.attempt.rubric_feedback;
    const count = [rb.situation, rb.task, rb.action, rb.result].filter(Boolean).length;
    return Math.round((count / 4) * 100);
  });
  const depthScores = evaluations.map((e) => {
    const totalKw = Math.max(1, e.matchedConcepts.length + e.missedConcepts.length);
    return Math.min(100, Math.round((e.matchedConcepts.length / totalKw) * 70) + (e.score >= 70 ? 30 : 15));
  });
  const evidenceScores = evaluations.map((e) => {
    const sig = analyzeCandidateResponse(e.attempt.user_answer);
    let pts = 35;
    if (sig.hasDecisionsOrTradeoffs) pts += 25;
    if (sig.hasEdgeCaseOrFailure) pts += 20;
    if (sig.hasValidationOrImpact) pts += 20;
    return Math.min(100, pts);
  });

  const avg = (nums: number[]) => Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  const structureAvg = avg(structureScores);
  const depthAvg = avg(depthScores);
  const evidenceAvg = avg(evidenceScores);

  const readinessLabel: SessionDebrief['readinessLabel'] =
    avgScore >= 78 ? 'Strong Hire Signal' : avgScore >= 58 ? 'Solid Progress' : 'Promising Foundation';

  const topStrengths = [...new Set(evaluations.flatMap((e) => e.strengths))].slice(0, 3);
  const priorityImprovements = [...new Set(evaluations.map((e) => e.growthTip))].slice(0, 2);

  const summaryNote =
    avgScore >= 78
      ? `Strong ${memory.targetRole} loop performance across ${evaluations.length} scenario${evaluations.length > 1 ? 's' : ''}. Your reasoning felt concrete, structured, and easy to follow as an interviewer.`
      : avgScore >= 58
        ? `Solid foundation for ${memory.targetRole} across ${evaluations.length} scenario${evaluations.length > 1 ? 's' : ''}. Tightening measurable outcomes and naming tradeoffs upfront will push these answers into clear hire territory.`
        : `Good reps completed for ${memory.targetRole}. Focus on leading with a concise one-sentence context, explaining why you chose a specific approach, and closing with how you verified the result.`;

  return {
    overallScore: avgScore,
    readinessLabel,
    summaryNote,
    dimensions: [
      {
        label: 'Structure & Clarity',
        score: structureAvg,
        comment: structureAvg >= 75 ? 'Easy to follow from setup to outcome.' : 'Anchor context -> decision -> result more explicitly.',
      },
      {
        label: 'Role & Technical Depth',
        score: depthAvg,
        comment: depthAvg >= 70 ? `Solid command of ${memory.targetRole} concepts.` : 'Pull in more role-specific mechanisms and edge cases.',
      },
      {
        label: 'Evidence & Tradeoffs',
        score: evidenceAvg,
        comment: evidenceAvg >= 75 ? 'Good discussion of alternatives, failure modes, and metrics.' : 'Highlight what alternatives you weighed and how you measured impact.',
      },
    ],
    topStrengths,
    priorityImprovements,
    questionsCompleted: evaluations.length,
  };
}
