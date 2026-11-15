import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  HelpCircle,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { requestAI } from '../features/ai/aiGateway';
import {
  getQuestionCoachingHint,
  getRoleTailoredInterviewQuestions,
  type CuratedInterviewQuestion,
} from '../features/interview/curatedInterviewCatalog';
import {
  buildInterviewLoopQueue,
  buildOpeningGreetingTurn,
  buildQuestionIntroTurn,
  buildSessionDebrief,
  evaluateQuestionExchange,
  extractFirstName,
  extractMentionedTools,
  generateInterviewerTurn,
  type CandidateMemory,
  type ConversationTurn,
  type DifficultyPreference,
  type InterviewFocusMode,
  type QuestionEvaluationSummary,
  type SessionDebrief,
} from '../features/interview/interviewSessionEngine';
import { getOrCreateCareerBlueprint, type CareerCategory } from '../features/roadmap/careerCatalog';
import { supabase } from '../lib/supabase';
import { InterviewSkeleton } from './SkeletonScreen';

interface Props {
  userId: string;
  targetRole: string;
  targetRoleCategory?: CareerCategory;
  experienceLevel?: 'beginner' | 'switcher' | 'junior' | 'mid';
  userName?: string;
  onAIUsageChanged?: () => Promise<void> | void;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface StoredAttemptSummary {
  id: string;
  question_id: string;
  question_text: string;
  round: string;
  score: number;
  signal_label: string;
  user_answer: string;
  matched_keywords: string[];
  created_at: string;
}

type SessionStage = 'warmup' | 'questioning' | 'awaiting_continue' | 'debrief';

const FOCUS_OPTIONS: Array<{ value: InterviewFocusMode; label: string }> = [
  { value: 'Mixed', label: 'Realistic Loop' },
  { value: 'Behavioral', label: 'Behavioral' },
  { value: 'Technical', label: 'Technical' },
  { value: 'System Design', label: 'System Design' },
];

const DIFFICULTY_OPTIONS: DifficultyPreference[] = ['Adaptive', 'Junior', 'Mid', 'Senior'];

function historyStorageKey(userId: string): string {
  return `career_pilot_interview_history_v2_${userId}`;
}

function loadLocalHistory(userId: string): StoredAttemptSummary[] {
  try {
    const raw = localStorage.getItem(historyStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAttemptSummary[]) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(userId: string, items: StoredAttemptSummary[]): void {
  try {
    localStorage.setItem(historyStorageKey(userId), JSON.stringify(items.slice(0, 20)));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const InterviewSimulatorView: React.FC<Props> = ({
  userId,
  targetRole,
  targetRoleCategory,
  experienceLevel,
  userName,
  onAIUsageChanged,
}) => {
  const resolvedCategory = useMemo(
    () => targetRoleCategory ?? getOrCreateCareerBlueprint(targetRole).category,
    [targetRole, targetRoleCategory]
  );

  const firstName = useMemo(() => extractFirstName(userName), [userName]);

  // Pool & setup state
  const [loading, setLoading] = useState(true);
  const [remoteQuestions, setRemoteQuestions] = useState<CuratedInterviewQuestion[]>([]);
  const [focusMode, setFocusMode] = useState<InterviewFocusMode>('Mixed');
  const [difficultyPref, setDifficultyPref] = useState<DifficultyPreference>('Adaptive');
  const [showQuestionBank, setShowQuestionBank] = useState(false);

  // Conversational interview session state
  const [loopQueue, setLoopQueue] = useState<CuratedInterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<SessionStage>('warmup');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [userTurnsForCurrentQ, setUserTurnsForCurrentQ] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<QuestionEvaluationSummary[]>([]);
  const [sessionDebrief, setSessionDebrief] = useState<SessionDebrief | null>(null);
  const [memory, setMemory] = useState<CandidateMemory>({
    firstName,
    targetRole,
    experienceLevel,
    mentionedTools: [],
  });

  // UI & Composer state
  const [draftAnswer, setDraftAnswer] = useState('');
  const [isInterviewerTyping, setIsInterviewerTyping] = useState(false);
  const [expandedSampleIds, setExpandedSampleIds] = useState<Record<string, boolean>>({});
  const [loadingAIQuestionId, setLoadingAIQuestionId] = useState<string | null>(null);
  const [aiStatusNote, setAiStatusNote] = useState<string>('');
  const [history, setHistory] = useState<StoredAttemptSummary[]>(() => loadLocalHistory(userId));
  const [showHistory, setShowHistory] = useState(false);

  // Voice Input & Read-Aloud (TTS) state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceReadAloud, setVoiceReadAloud] = useState(false);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);

  // Subtle pacing timer (counts up/down gently without intrusive pressure)
  const [paceSeconds, setPaceSeconds] = useState(120);
  const [isPaceRunning, setIsPaceRunning] = useState(false);

  const tailoredPool = useMemo(
    () =>
      getRoleTailoredInterviewQuestions(
        resolvedCategory,
        targetRole,
        focusMode === 'Mixed' ? undefined : focusMode
      ),
    [resolvedCategory, targetRole, focusMode]
  );

  const currentQuestion = loopQueue[currentIndex] ?? null;

  const speakText = (text: string) => {
    if (!voiceReadAloud || !ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\n+/g, ' '));
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore browser speech synthesis failures
    }
  };

  useEffect(() => {
    if (!voiceReadAloud && ttsSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }, [voiceReadAloud, ttsSupported]);

  useEffect(() => {
    const win = window as unknown as SpeechWindow;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            finalTranscript += `${event.results[i][0].transcript} `;
          }
        }
        if (finalTranscript.trim()) {
          setDraftAnswer((prev) => `${prev ? `${prev.trimEnd()} ` : ''}${finalTranscript.trim()}`);
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (thinkingTimerRef.current) window.clearTimeout(thinkingTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (ttsSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [ttsSupported]);

  useEffect(() => {
    if (!isPaceRunning || paceSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setPaceSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPaceRunning, paceSeconds]);

  const startNewSession = (
    overrideFocus: InterviewFocusMode = focusMode,
    overrideDifficulty: DifficultyPreference = difficultyPref,
    overrideRemote: CuratedInterviewQuestion[] = remoteQuestions,
    specificStartQuestion?: CuratedInterviewQuestion
  ) => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setIsInterviewerTyping(false);
    setDraftAnswer('');
    setFollowUpCount(0);
    setUserTurnsForCurrentQ([]);
    setEvaluations([]);
    setSessionDebrief(null);
    setAiStatusNote('');
    setExpandedSampleIds({});
    setPaceSeconds(120);
    setIsPaceRunning(false);

    const freshMemory: CandidateMemory = {
      firstName,
      targetRole,
      experienceLevel,
      mentionedTools: [],
    };
    setMemory(freshMemory);

    let queue = buildInterviewLoopQueue({
      category: resolvedCategory,
      targetRole,
      focusMode: overrideFocus,
      difficulty: overrideDifficulty,
      experienceLevel,
      remoteQuestions: overrideRemote,
      count: 4,
    });

    if (specificStartQuestion) {
      queue = [specificStartQuestion, ...queue.filter((q) => q.id !== specificStartQuestion.id)].slice(0, 4);
    }

    setLoopQueue(queue);
    setCurrentIndex(0);

    if (specificStartQuestion) {
      // Jump straight into the chosen question naturally
      const opener = buildQuestionIntroTurn({
        question: specificStartQuestion,
        questionIndex: 0,
        totalQuestions: queue.length,
        memory: freshMemory,
      });
      setStage('questioning');
      setTurns([opener]);
      setIsPaceRunning(true);
      speakText(opener.text);
    } else {
      const greeting = buildOpeningGreetingTurn(freshMemory, overrideFocus);
      setStage('warmup');
      setTurns([greeting]);
      speakText(greeting.text);
    }
  };

  // Load questions/history safely on mount or role change
  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      let loadedRemote: CuratedInterviewQuestion[] = [];
      try {
        const { data, error } = await supabase
          .from('interview_questions')
          .select('id,role_category,round,difficulty,question,expected_keywords,rubric,model_answer')
          .eq('role_category', resolvedCategory)
          .limit(20);
        if (!error && Array.isArray(data)) {
          loadedRemote = data
            .filter(
              (item): item is CuratedInterviewQuestion =>
                typeof item?.id === 'string' &&
                typeof item?.question === 'string' &&
                Array.isArray(item?.expected_keywords)
            )
            .map((item) => ({
              ...item,
              role_category: resolvedCategory,
              rubric: {
                situation: Boolean(item.rubric?.situation ?? true),
                task: Boolean(item.rubric?.task ?? true),
                action: Boolean(item.rubric?.action ?? true),
                result: Boolean(item.rubric?.result ?? true),
              },
              model_answer: item.model_answer || 'Walk through context, key tradeoffs, verification, and measurable outcome.',
            }));
        }
      } catch {
        // Fallback cleanly to curated role-tailored catalog
      }

      if (!active) return;
      setRemoteQuestions(loadedRemote);
      setHistory(loadLocalHistory(userId));
      setLoading(false);
    };
    void init();
    return () => {
      active = false;
    };
  }, [userId, resolvedCategory]);

  // Initialize first session whenever loading completes or targetRole changes
  useEffect(() => {
    if (!loading) {
      startNewSession(focusMode, difficultyPref, remoteQuestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, targetRole, resolvedCategory]);

  // Smooth scroll to latest turn when dialogue progresses
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns.length, isInterviewerTyping, sessionDebrief]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const persistCompletedAttempt = async (summary: QuestionEvaluationSummary) => {
    const item: StoredAttemptSummary = {
      id: summary.attempt.id,
      question_id: summary.questionId,
      question_text: summary.questionText,
      round: summary.round,
      score: summary.score,
      signal_label: summary.signalLabel,
      user_answer: summary.attempt.user_answer,
      matched_keywords: summary.matchedConcepts,
      created_at: summary.attempt.created_at,
    };

    const nextHistory = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 20);
    setHistory(nextHistory);
    saveLocalHistory(userId, nextHistory);

    // Opportunistically persist if Supabase `interview_attempts` is configured & question uses UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(summary.questionId);
    if (isUuid && !userId.startsWith('demo')) {
      try {
        await supabase.from('interview_attempts').insert({
          user_id: userId,
          question_id: summary.questionId,
          user_answer: summary.attempt.user_answer,
          score: summary.score,
          matched_keywords: summary.matchedConcepts,
          rubric_feedback: summary.attempt.rubric_feedback,
        });
      } catch {
        // Non-blocking: local history already saved
      }
    }
  };

  const scheduleInterviewerReply = (fn: () => void) => {
    setIsInterviewerTyping(true);
    if (thinkingTimerRef.current) window.clearTimeout(thinkingTimerRef.current);
    thinkingTimerRef.current = window.setTimeout(() => {
      setIsInterviewerTyping(false);
      fn();
    }, 340);
  };

  const handleSkipWarmup = () => {
    if (!currentQuestion || isInterviewerTyping) return;
    const introTurn = buildQuestionIntroTurn({
      question: currentQuestion,
      questionIndex: 0,
      totalQuestions: loopQueue.length,
      memory,
    });
    setStage('questioning');
    setPaceSeconds(120);
    setIsPaceRunning(true);
    setTurns((prev) => [...prev, introTurn]);
    speakText(introTurn.text);
  };

  const handleAdvanceToNextQuestion = () => {
    if (isInterviewerTyping) return;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= loopQueue.length) {
      handleFinishAndDebrief();
      return;
    }

    const nextQ = loopQueue[nextIdx];
    setCurrentIndex(nextIdx);
    setFollowUpCount(0);
    setUserTurnsForCurrentQ([]);
    setStage('questioning');
    setPaceSeconds(120);
    setIsPaceRunning(true);

    const nextTurn = buildQuestionIntroTurn({
      question: nextQ,
      questionIndex: nextIdx,
      totalQuestions: loopQueue.length,
      memory,
    });

    setTurns((prev) => [...prev, nextTurn]);
    speakText(nextTurn.text);
  };

  const handleFinishAndDebrief = () => {
    if (isInterviewerTyping) return;
    setIsPaceRunning(false);

    // If the user has an active unanswered/partial exchange with >= 1 response, evaluate it before debrief
    let allEvaluations = [...evaluations];
    if (currentQuestion && userTurnsForCurrentQ.length > 0 && stage === 'questioning') {
      const partialEval = evaluateQuestionExchange({
        question: currentQuestion,
        combinedAnswer: userTurnsForCurrentQ.join('\n\n'),
        targetRole,
      });
      allEvaluations = [...allEvaluations, partialEval];
      setEvaluations(allEvaluations);
      void persistCompletedAttempt(partialEval);
    }

    const debrief = buildSessionDebrief(allEvaluations, memory);
    setSessionDebrief(debrief);
    setStage('debrief');

    const closingTurn: ConversationTurn = {
      id: `turn-debrief-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'coach',
      kind: 'debrief',
      timestamp: new Date().toISOString(),
      badge: `${debrief.readinessLabel}${debrief.questionsCompleted > 0 ? ` · ${debrief.overallScore}%` : ''}`,
      text: debrief.summaryNote,
      debrief,
    };
    setTurns((prev) => [...prev, closingTurn]);
    speakText(debrief.summaryNote);
  };

  const handleSendMessage = () => {
    const trimmed = draftAnswer.trim();
    if (!trimmed || isInterviewerTyping || stage === 'debrief') return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const candidateTurn: ConversationTurn = {
      id: `turn-user-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'candidate',
      kind: 'answer',
      timestamp: new Date().toISOString(),
      questionId: currentQuestion?.id,
      text: trimmed,
    };

    setTurns((prev) => [...prev, candidateTurn]);
    setDraftAnswer('');

    // Track tools mentioned across the session in candidate memory
    const toolsInReply = extractMentionedTools(trimmed);
    const updatedMemory: CandidateMemory = {
      ...memory,
      mentionedTools: [...new Set([...memory.mentionedTools, ...toolsInReply])],
      warmupSummary: stage === 'warmup' ? trimmed : memory.warmupSummary,
    };
    setMemory(updatedMemory);

    if (stage === 'warmup') {
      if (!currentQuestion) {
        handleFinishAndDebrief();
        return;
      }
      scheduleInterviewerReply(() => {
        const introTurn = buildQuestionIntroTurn({
          question: currentQuestion,
          questionIndex: 0,
          totalQuestions: loopQueue.length,
          memory: updatedMemory,
          transitionFromWarmup: true,
        });
        setStage('questioning');
        setPaceSeconds(120);
        setIsPaceRunning(true);
        setTurns((prev) => [...prev, introTurn]);
        speakText(introTurn.text);
      });
      return;
    }

    if (stage === 'awaiting_continue') {
      // User sent a note while between questions -> acknowledge and transition smoothly
      handleAdvanceToNextQuestion();
      return;
    }

    if (!currentQuestion) return;

    const updatedTurnsForQ = [...userTurnsForCurrentQ, trimmed];
    const outcome = generateInterviewerTurn({
      question: currentQuestion,
      previousUserTurnsForQuestion: userTurnsForCurrentQ,
      latestAnswer: trimmed,
      followUpCount,
      memory: updatedMemory,
    });

    scheduleInterviewerReply(() => {
      if (outcome.action === 'clarify') {
        setTurns((prev) => [...prev, outcome.interviewerTurn]);
        speakText(outcome.interviewerTurn.text);
        return;
      }

      if (outcome.action === 'ask_followup') {
        setUserTurnsForCurrentQ(updatedTurnsForQ);
        setFollowUpCount((prev) => prev + 1);
        setTurns((prev) => [...prev, outcome.interviewerTurn]);
        speakText(outcome.interviewerTurn.text);
        return;
      }

      // Completed question exchange
      setUserTurnsForCurrentQ(updatedTurnsForQ);
      setIsPaceRunning(false);
      if (outcome.evaluation) {
        const evalSummary = outcome.evaluation;
        setEvaluations((prev) => [...prev, evalSummary]);
        void persistCompletedAttempt(evalSummary);
      }
      setStage('awaiting_continue');
      setTurns((prev) => [...prev, outcome.interviewerTurn]);
      speakText(outcome.interviewerTurn.text);
    });
  };

  const handleAskForHint = () => {
    if (!currentQuestion || stage !== 'questioning' || isInterviewerTyping) return;
    const hintText = getQuestionCoachingHint(currentQuestion, targetRole);
    const hintTurn: ConversationTurn = {
      id: `turn-hint-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'interviewer',
      kind: 'clarification',
      timestamp: new Date().toISOString(),
      questionId: currentQuestion.id,
      badge: 'Interviewer steer',
      interviewer: turns.find((t) => t.questionId === currentQuestion.id && t.interviewer)?.interviewer,
      text: `Here is how I'd frame this if we were pairing: ${hintText}`,
    };
    setTurns((prev) => [...prev, hintTurn]);
    speakText(hintTurn.text);
  };

  const handleRequestAICritique = async (evalSummary: QuestionEvaluationSummary) => {
    setLoadingAIQuestionId(evalSummary.questionId);
    setAiStatusNote('');
    try {
      const result = await requestAI<{ ai_feedback: string }>('interview', {
        question: evalSummary.questionText,
        target_role: targetRole,
        answer: evalSummary.attempt.user_answer,
        score: String(evalSummary.score),
        rubric: JSON.stringify(evalSummary.attempt.rubric_feedback),
      });

      const critiqueText = result.response?.ai_feedback?.trim();
      if (critiqueText) {
        setTurns((prev) =>
          prev.map((turn) =>
            turn.evaluation?.questionId === evalSummary.questionId
              ? {
                  ...turn,
                  evaluation: {
                    ...turn.evaluation,
                    aiCritique: critiqueText,
                  },
                }
              : turn
          )
        );
        setEvaluations((prev) =>
          prev.map((ev) => (ev.questionId === evalSummary.questionId ? { ...ev, aiCritique: critiqueText } : ev))
        );
        await onAIUsageChanged?.();
      }
    } catch {
      setAiStatusNote('Live AI critique is unavailable right now — your structured coaching note above includes our full heuristic breakdown.');
    } finally {
      setLoadingAIQuestionId(null);
    }
  };

  const handleSelectFocusMode = (mode: InterviewFocusMode) => {
    setFocusMode(mode);
    startNewSession(mode, difficultyPref, remoteQuestions);
  };

  const handleSelectDifficulty = (diff: DifficultyPreference) => {
    setDifficultyPref(diff);
    startNewSession(focusMode, diff, remoteQuestions);
  };

  const handleJumpToQuestion = (question: CuratedInterviewQuestion) => {
    setShowQuestionBank(false);
    startNewSession(focusMode, difficultyPref, remoteQuestions, question);
  };

  if (loading) {
    return <InterviewSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px', margin: '0 auto', width: '100%' }}>
      {/* Header & Clean Session Controls */}
      <div className="m3-surface-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--md-primary)' }}>
                Mock Interview Studio
              </span>
              <span style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>·</span>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)', fontWeight: 600 }}>
                {targetRole}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--md-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Conversational Interview Practice
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {ttsSupported && (
              <button
                type="button"
                onClick={() => setVoiceReadAloud((prev) => !prev)}
                title={voiceReadAloud ? 'Mute interviewer voice' : 'Read interviewer prompts aloud'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: voiceReadAloud ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                  background: voiceReadAloud ? 'var(--md-primary-container)' : 'var(--md-surface)',
                  color: voiceReadAloud ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {voiceReadAloud ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{voiceReadAloud ? 'Voice On' : 'Read Aloud'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowQuestionBank((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: showQuestionBank ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                background: showQuestionBank ? 'var(--md-primary-container)' : 'var(--md-surface)',
                color: showQuestionBank ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <BookOpen size={14} />
              <span>Question Bank ({tailoredPool.length})</span>
            </button>

            <button
              type="button"
              onClick={() => startNewSession(focusMode, difficultyPref, remoteQuestions)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface)',
                color: 'var(--md-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>New Loop</span>
            </button>
          </div>
        </div>

        {/* Minimalist Focus & Calibration Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--md-outline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--md-text-muted)', marginRight: '4px' }}>
              Format:
            </span>
            {FOCUS_OPTIONS.map((opt) => {
              const active = focusMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectFocusMode(opt.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                    background: active ? 'var(--md-primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--md-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--md-text-muted)', marginRight: '4px' }}>
              Level:
            </span>
            {DIFFICULTY_OPTIONS.map((diff) => {
              const active = difficultyPref === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => handleSelectDifficulty(diff)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                    background: active ? 'var(--md-primary-container)' : 'transparent',
                    color: active ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Question Bank Picker */}
        {showQuestionBank && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--md-outline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                Role-Specific Questions for {targetRole}
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--md-text-muted)' }}>
                Select any prompt to practice conversationally
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {tailoredPool.map((q) => {
                const isActive = currentQuestion?.id === q.id && stage !== 'warmup';
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJumpToQuestion(q)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isActive ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                      background: isActive ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)', display: 'block', marginBottom: '2px' }}>
                        {q.round} · {q.difficulty}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--md-text-primary)', lineHeight: 1.4 }}>
                        {q.question}
                      </span>
                    </div>
                    <ArrowRight size={14} color="var(--md-text-secondary)" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Conversational Interview Room */}
      <div className="m3-surface-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Live Room Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--md-outline)',
            background: 'var(--md-surface-variant)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={15} color="var(--md-primary)" />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
              {stage === 'warmup'
                ? 'Warm-Up Introduction'
                : stage === 'debrief'
                  ? 'Hiring Manager Debrief'
                  : `Question ${currentIndex + 1} of ${loopQueue.length} · ${currentQuestion?.round ?? ''}`}
            </span>
            {stage === 'questioning' && followUpCount > 0 && (
              <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', fontWeight: 500 }}>
                · Follow-up turn
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {stage !== 'warmup' && stage !== 'debrief' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface)',
                  fontSize: '12px',
                  color: paceSeconds <= 15 ? 'var(--md-warning)' : 'var(--md-text-secondary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <Clock size={12} />
                <span>{formatClock(paceSeconds)}</span>
                <button
                  type="button"
                  onClick={() => setIsPaceRunning((prev) => !prev)}
                  aria-label={isPaceRunning ? 'Pause pacing timer' : 'Start pacing timer'}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 2px',
                    cursor: 'pointer',
                    color: 'var(--md-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {isPaceRunning ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
            )}

            {stage !== 'debrief' && (evaluations.length > 0 || stage === 'questioning') && (
              <button
                type="button"
                onClick={handleFinishAndDebrief}
                disabled={isInterviewerTyping}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface)',
                  color: 'var(--md-text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Flag size={12} />
                <span>End & Debrief</span>
              </button>
            )}
          </div>
        </div>

        {/* Dialogue Thread */}
        <div
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '340px',
            maxHeight: '620px',
            overflowY: 'auto',
          }}
        >
          {turns.map((turn) => {
            const isCandidate = turn.speaker === 'candidate';

            if (turn.kind === 'evaluation' && turn.evaluation) {
              const ev = turn.evaluation;
              const isSampleOpen = Boolean(expandedSampleIds[ev.questionId]);
              return (
                <div
                  key={turn.id}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid var(--md-outline)',
                    background: 'var(--md-surface-variant)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Interviewer Note · {ev.round}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--md-text-primary)', fontWeight: 600 }}>
                        {turn.text}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        background: 'var(--md-surface)',
                        border: '1px solid var(--md-outline)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--md-primary)',
                      }}
                    >
                      {ev.signalLabel} · {ev.score}%
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        What landed well
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.5 }}>
                        {ev.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        How to sharpen it
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.5 }}>
                        {ev.growthTip}
                      </p>
                    </div>
                  </div>

                  {/* Subtle concept coverage strip */}
                  {(ev.matchedConcepts.length > 0 || ev.missedConcepts.length > 0) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)', marginRight: '4px' }}>
                        Key signals:
                      </span>
                      {ev.matchedConcepts.map((c) => (
                        <span
                          key={c}
                          style={{
                            padding: '2px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'var(--md-primary-container)',
                            color: 'var(--md-on-primary-container)',
                          }}
                        >
                          ✓ {c}
                        </span>
                      ))}
                      {ev.missedConcepts.map((c) => (
                        <span
                          key={c}
                          style={{
                            padding: '2px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            color: 'var(--md-text-muted)',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {ev.aiCritique && (
                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Sparkles size={13} color="var(--md-primary)" />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-primary)' }}>
                          AI Coach Critique
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.55 }}>
                        {ev.aiCritique}
                      </p>
                    </div>
                  )}

                  {isSampleOpen && (
                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Example Strong Answer
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.55 }}>
                        {ev.modelAnswer}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSampleIds((prev) => ({
                            ...prev,
                            [ev.questionId]: !prev[ev.questionId],
                          }))
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface)',
                          color: 'var(--md-text-secondary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isSampleOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{isSampleOpen ? 'Hide sample answer' : 'View sample answer'}</span>
                      </button>

                      {!ev.aiCritique && (
                        <button
                          type="button"
                          onClick={() => void handleRequestAICritique(ev)}
                          disabled={loadingAIQuestionId === ev.questionId}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            border: '1px solid var(--md-outline)',
                            background: 'var(--md-surface)',
                            color: 'var(--md-primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Sparkles size={13} />
                          <span>{loadingAIQuestionId === ev.questionId ? 'Reviewing…' : 'AI Coach Critique'}</span>
                        </button>
                      )}
                    </div>

                    {stage === 'awaiting_continue' && currentQuestion?.id === ev.questionId && (
                      <button
                        type="button"
                        className="btn-m3-primary"
                        onClick={handleAdvanceToNextQuestion}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12.5px' }}
                      >
                        <span>
                          {currentIndex + 1 >= loopQueue.length
                            ? 'Finish & View Debrief'
                            : `Continue to Q${currentIndex + 2}`}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (turn.kind === 'debrief' && turn.debrief) {
              const d = turn.debrief;
              return (
                <div
                  key={turn.id}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid var(--md-primary)',
                    background: 'var(--md-surface)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-primary)' }}>
                        Session Debrief · {targetRole}
                      </span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                        {d.readinessLabel}
                      </h3>
                    </div>
                    {d.questionsCompleted > 0 && (
                      <div
                        style={{
                          padding: '8px 16px',
                          borderRadius: '12px',
                          background: 'var(--md-primary-container)',
                          color: 'var(--md-on-primary-container)',
                          fontSize: '18px',
                          fontWeight: 800,
                        }}
                      >
                        {d.overallScore}%
                      </div>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--md-text-primary)' }}>
                    {d.summaryNote}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                    {d.dimensions.map((dim) => (
                      <div
                        key={dim.label}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'var(--md-surface-variant)',
                          border: '1px solid var(--md-outline)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>{dim.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-primary)' }}>{dim.score}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'var(--md-outline)', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${dim.score}%`, height: '100%', background: 'var(--md-primary)', borderRadius: '9999px' }} />
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', lineHeight: 1.4, display: 'block' }}>
                          {dim.comment}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Strongest Signals
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.55 }}>
                        {d.topStrengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Priority Habits Next Loop
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.55 }}>
                        {d.priorityImprovements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-m3-primary"
                      onClick={() => startNewSession(focusMode, difficultyPref, remoteQuestions)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={14} />
                      <span>Start Another Interview Loop</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={turn.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCandidate ? 'flex-end' : 'flex-start',
                }}
              >
                {!isCandidate && turn.interviewer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--md-primary)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {turn.interviewer.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                      {turn.interviewer.name}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--md-text-muted)' }}>
                      {turn.interviewer.roleTitle}
                    </span>
                    {turn.badge && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'var(--md-surface-variant)',
                          border: '1px solid var(--md-outline)',
                          color: 'var(--md-text-secondary)',
                        }}
                      >
                        {turn.badge}
                      </span>
                    )}
                  </div>
                )}

                {isCandidate && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)', marginBottom: '4px' }}>
                    {firstName || 'You'}
                  </span>
                )}

                <div
                  style={{
                    maxWidth: '88%',
                    padding: '14px 18px',
                    borderRadius: isCandidate ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    border: isCandidate ? '1px solid rgba(18, 60, 105, 0.2)' : '1px solid var(--md-outline)',
                    background: isCandidate ? 'var(--md-primary-container)' : 'var(--md-surface)',
                    color: isCandidate ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)',
                    fontSize: '14px',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {turn.text}
                </div>
              </div>
            );
          })}

          {isInterviewerTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px' }}>
              <span className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              <span style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', fontStyle: 'italic' }}>
                Interviewer is considering your response…
              </span>
            </div>
          )}

          {aiStatusNote && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              {aiStatusNote}
            </p>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Sticky Composer */}
        {stage !== 'debrief' && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isInterviewerTyping}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: isRecording ? '1px solid var(--md-error)' : '1px solid var(--md-outline)',
                      background: isRecording ? 'var(--md-error-bg)' : 'var(--md-surface)',
                      color: isRecording ? 'var(--md-error)' : 'var(--md-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isRecording ? 'Listening…' : 'Speak Answer'}</span>
                  </button>
                )}

                {stage === 'questioning' && (
                  <button
                    type="button"
                    onClick={handleAskForHint}
                    disabled={isInterviewerTyping}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <HelpCircle size={13} />
                    <span>Ask for a Steer</span>
                  </button>
                )}

                {stage === 'warmup' && (
                  <button
                    type="button"
                    onClick={handleSkipWarmup}
                    disabled={isInterviewerTyping}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <SkipForward size={13} />
                    <span>Jump straight to Q1</span>
                  </button>
                )}

                {stage === 'questioning' && (
                  <button
                    type="button"
                    onClick={handleAdvanceToNextQuestion}
                    disabled={isInterviewerTyping}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <SkipForward size={13} />
                    <span>Next Question</span>
                  </button>
                )}
              </div>

              <span style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                Ctrl + Enter to send
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                id="interview-answer"
                rows={3}
                value={draftAnswer}
                maxLength={6000}
                disabled={isInterviewerTyping}
                onChange={(e) => setDraftAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  stage === 'warmup'
                    ? 'Briefly share what you built or debugged recently (tools, scale, outcome)...'
                    : stage === 'awaiting_continue'
                      ? 'Click Continue above or add a quick note to advance...'
                      : followUpCount > 0
                        ? 'Respond directly to the follow-up probe...'
                        : 'Walk through your thinking naturally: context, choices, tradeoffs, and how you verified impact...'
                }
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface)',
                  fontFamily: 'var(--font-main)',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  outline: 'none',
                  color: 'var(--md-text-primary)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                className="btn-m3-primary"
                onClick={handleSendMessage}
                disabled={!draftAnswer.trim() || isInterviewerTyping}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '11px 18px',
                  minHeight: '44px',
                  flexShrink: 0,
                }}
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compact Collapsible Practice History */}
      {history.length > 0 && (
        <div className="m3-surface-card" style={{ padding: '16px 22px' }}>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--md-text-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} color="var(--md-primary)" />
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
                Recent Practice Responses ({history.length})
              </span>
            </div>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              {history.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-outline)',
                    background: 'var(--md-surface-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)', display: 'block', marginBottom: '2px' }}>
                      {item.round} · {item.signal_label}
                    </span>
                    <p style={{ margin: '0 0 4px', fontSize: '12.5px', fontWeight: 600, color: 'var(--md-text-primary)' }}>
                      {item.question_text}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-text-secondary)', lineHeight: 1.45 }}>
                      {item.user_answer.length > 140 ? `${item.user_answer.slice(0, 140)}…` : item.user_answer}
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-primary)', flexShrink: 0 }}>
                    {item.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
