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
  Phone,
  PhoneOff,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  requestAI,
  requestInterviewTurn,
  requestLiveInterviewToken,
  type LiveVoiceName,
} from '../features/ai/aiGateway';
import {
  getQuestionCoachingHint,
  getRoleTailoredInterviewQuestions,
  type CuratedInterviewQuestion,
} from '../features/interview/curatedInterviewCatalog';
import {
  GeminiLiveSessionClient,
  type LiveSessionState,
} from '../features/interview/geminiLiveClient';
import {
  createHybridSpeechController,
  isVoiceCaptureSupported,
  parseVoiceCommand,
  type HybridSpeechController,
  type VoiceCommandType,
} from '../features/interview/speechCapture';
import {
  buildInterviewLoopQueue,
  buildOpeningGreetingTurn,
  buildQuestionIntroTurn,
  buildSessionDebrief,
  evaluateQuestionExchange,
  extractFirstName,
  extractMentionedTools,
  generateInterviewerTurn,
  getInterviewerPersona,
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

const LIVE_VOICE_OPTIONS: Array<{ id: LiveVoiceName; label: string }> = [
  { id: 'Kore', label: 'Kore (Warm Mentor)' },
  { id: 'Aoede', label: 'Aoede (Expressive)' },
  { id: 'Puck', label: 'Puck (Conversational)' },
  { id: 'Charon', label: 'Charon (Executive)' },
  { id: 'Fenrir', label: 'Fenrir (Direct Lead)' },
];

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

  // Voice Input, Hybrid Transcription & Read-Aloud (TTS) state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [voiceStatusNote, setVoiceStatusNote] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceReadAloud, setVoiceReadAloud] = useState(false);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechControllerRef = useRef<HybridSpeechController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);

  // Gemini Live Bidirectional Human Voice Conversation state
  const [liveState, setLiveState] = useState<LiveSessionState>('idle');
  const [liveVoice, setLiveVoice] = useState<LiveVoiceName>('Kore');
  const [liveActiveModel, setLiveActiveModel] = useState('');
  const [isLiveMuted, setIsLiveMuted] = useState(false);
  const [isLiveAiSpeaking, setIsLiveAiSpeaking] = useState(false);
  const [liveUserCaption, setLiveUserCaption] = useState('');
  const [liveAiCaption, setLiveAiCaption] = useState('');
  const liveClientRef = useRef<GeminiLiveSessionClient | null>(null);

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

  const speakText = (text: string, forceSpeak = false) => {
    if ((!voiceReadAloud && !forceSpeak) || !ttsSupported || liveState === 'connected') return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\n+/g, ' '));
      utterance.rate = 0.99;
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
    setSpeechSupported(isVoiceCaptureSupported());

    return () => {
      if (thinkingTimerRef.current) window.clearTimeout(thinkingTimerRef.current);
      speechControllerRef.current?.abort();
      speechControllerRef.current = null;
      void liveClientRef.current?.disconnect();
      liveClientRef.current = null;
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

  const executeVoiceCommand = (command: VoiceCommandType): boolean => {
    if (command === 'next') {
      if (stage === 'warmup') {
        handleSkipWarmup();
        return true;
      }
      if (stage === 'questioning' || stage === 'awaiting_continue') {
        handleAdvanceToNextQuestion();
        return true;
      }
      return false;
    }
    if (command === 'hint') {
      if (stage === 'questioning') {
        handleAskForHint();
        return true;
      }
      return false;
    }
    if (command === 'repeat') {
      const lastInterviewerTurn = [...turns].reverse().find((t) => t.speaker === 'interviewer');
      if (lastInterviewerTurn) {
        if (liveState === 'connected' && liveClientRef.current) {
          liveClientRef.current.sendTextTurn('Could you please repeat that last question concisely?');
        } else {
          speakText(lastInterviewerTurn.text, true);
          setVoiceStatusNote('Repeating interviewer prompt aloud.');
        }
        return true;
      }
      return false;
    }
    if (command === 'end') {
      if (stage !== 'debrief') {
        handleFinishAndDebrief();
        return true;
      }
      return false;
    }
    if (command === 'restart') {
      startNewSession(focusMode, difficultyPref, remoteQuestions);
      return true;
    }
    return false;
  };

  const handleToggleLiveMute = () => {
    if (!liveClientRef.current || liveState !== 'connected') return;
    const nextMuted = !isLiveMuted;
    liveClientRef.current.setMuted(nextMuted);
    setIsLiveMuted(nextMuted);
    setVoiceStatusNote(nextMuted ? 'Live mic muted.' : 'Live mic active — speak naturally.');
  };

  const handleToggleLiveCall = async () => {
    if (liveState === 'connected' || liveState === 'connecting') {
      await liveClientRef.current?.disconnect();
      liveClientRef.current = null;
      setLiveState('idle');
      setIsLiveMuted(false);
      setIsLiveAiSpeaking(false);
      setLiveUserCaption('');
      setLiveAiCaption('');
      setLiveActiveModel('');
      setVoiceStatusNote('Live voice conversation ended.');
      return;
    }

    if (userId.startsWith('demo')) {
      setVoiceStatusNote('Sign in with your account to start a live Gemini audio call. You can still use Speak Answer & AI loop below.');
      return;
    }

    if (isRecording && speechControllerRef.current) {
      speechControllerRef.current.abort();
      speechControllerRef.current = null;
      setIsRecording(false);
    }

    if (ttsSupported) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    }

    setVoiceStatusNote('Connecting live human-voice interviewer…');
    setLiveState('connecting');
    setIsLiveMuted(false);

    try {
      const tokenRes = await requestLiveInterviewToken({
        target_role: targetRole,
        voice_name: liveVoice,
      });

      const questionSummary = loopQueue
        .map((q, idx) => `Q${idx + 1} (${q.round}, ${q.difficulty}): ${q.question}`)
        .join('\n');

      const systemInstruction = [
        `You are Maya, a warm, articulate, perceptive human hiring manager conducting a live spoken mock interview for a ${targetRole} candidate.`,
        firstName ? `The candidate's name is ${firstName}.` : '',
        experienceLevel ? `Calibrate expectations cleanly to ${experienceLevel} level (${difficultyPref}).` : '',
        `Focus mode: ${focusMode}. Speak naturally in crisp spoken sentences (typically 2-4 sentences per turn), acknowledge specifics the candidate says, listen patiently, ask insightful follow-up probes, and move cleanly through these topics one at a time:`,
        questionSummary,
        'Always respond verbally in a realistic conversational cadence. Never dump long bullet lists aloud.',
      ]
        .filter(Boolean)
        .join('\n');

      const client = new GeminiLiveSessionClient({
        onStateChange: (nextState) => {
          setLiveState(nextState);
          if (nextState === 'closed' || nextState === 'idle') {
            setIsLiveAiSpeaking(false);
            setLiveUserCaption('');
            setLiveAiCaption('');
          }
        },
        onModelActive: (activeModel) => {
          setLiveActiveModel(activeModel);
          setVoiceStatusNote(`Live voice active (${activeModel}) — speak naturally anytime.`);
        },
        onMicLevel: (level) => setMicLevel(level),
        onSpeakingStateChange: (speaking) => setIsLiveAiSpeaking(speaking),
        onUserTranscriptChunk: (partial) => setLiveUserCaption(partial),
        onInterviewerTranscriptChunk: (partial) => setLiveAiCaption(partial),
        onUserTurnCommitted: (finalText) => {
          const clean = finalText.trim();
          if (!clean) return;
          setTurns((prev) => [
            ...prev,
            {
              id: `turn-live-user-${crypto.randomUUID().slice(0, 8)}`,
              speaker: 'candidate',
              kind: 'answer',
              timestamp: new Date().toISOString(),
              questionId: currentQuestion?.id,
              badge: 'Voice',
              text: clean,
            },
          ]);
          const cmd = parseVoiceCommand(clean);
          if (cmd && (cmd.type === 'end' || cmd.type === 'restart')) {
            setVoiceStatusNote(`Voice command: ${cmd.label}`);
            void client.disconnect();
            executeVoiceCommand(cmd.type);
          }
        },
        onInterviewerTurnCommitted: (finalText) => {
          const clean = finalText.trim();
          if (!clean) return;
          const persona = getInterviewerPersona(currentQuestion?.round ?? 'Warmup', targetRole);
          setTurns((prev) => [
            ...prev,
            {
              id: `turn-live-ai-${crypto.randomUUID().slice(0, 8)}`,
              speaker: 'interviewer',
              kind: 'question',
              timestamp: new Date().toISOString(),
              questionId: currentQuestion?.id,
              badge: 'Gemini Live',
              interviewer: persona,
              text: clean,
            },
          ]);
        },
        onError: (msg) => {
          setVoiceStatusNote(msg);
        },
      });

      liveClientRef.current = client;
      const openerContext = stage === 'warmup'
        ? `Greet ${firstName || 'the candidate'} warmly for a ${targetRole} mock interview and invite a quick 30-second intro before Question 1.`
        : `Acknowledge we are switching into live voice conversation on Question ${currentIndex + 1}: "${currentQuestion?.question || ''}" and invite their thoughts.`;

      await client.connect({
        ephemeralToken: tokenRes.response.token,
        models: tokenRes.response.live_models,
        voiceName: liveVoice,
        systemInstruction,
        initialPrompt: openerContext,
      });

      await onAIUsageChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start live voice conversation.';
      setVoiceStatusNote(`${message} Falling back to Speak Answer / text interview.`);
      setLiveState('idle');
      liveClientRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (isTranscribingVoice) return;

    if (isRecording && speechControllerRef.current) {
      setIsRecording(false);
      setIsTranscribingVoice(true);
      setVoiceStatusNote('Transcribing speech with Gemini…');
      try {
        const result = await speechControllerRef.current.stop();
        speechControllerRef.current = null;
        setMicLevel(0);

        const transcript = result.transcript.trim();
        if (!transcript) {
          setVoiceStatusNote('No clear speech detected — speak close to your microphone and try again.');
          return;
        }

        const matchedCommand = parseVoiceCommand(transcript);
        if (matchedCommand) {
          setVoiceStatusNote(`Voice command: ${matchedCommand.label}`);
          if (executeVoiceCommand(matchedCommand.type)) return;
        }

        if (autoSendVoice) {
          setVoiceStatusNote(
            result.source === 'gemini'
              ? 'Transcribed via Gemini & sent to interviewer.'
              : 'Transcribed & sent to interviewer.'
          );
          if (!voiceReadAloud && ttsSupported) {
            setVoiceReadAloud(true);
          }
          await submitCandidateMessage(transcript, { fromVoice: true });
        } else {
          setDraftAnswer((prev) => `${prev ? `${prev.trimEnd()} ` : ''}${transcript}`);
          setVoiceStatusNote('Voice transcribed into answer box — edit or press Send.');
        }
      } catch {
        setVoiceStatusNote('Could not finish voice transcription. Please type or try again.');
      } finally {
        setIsTranscribingVoice(false);
      }
      return;
    }

    if (ttsSupported) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    }

    const baseDraft = draftAnswer.trim();
    const controller = createHybridSpeechController({
      preferGeminiTranscription: !userId.startsWith('demo'),
      transcribeHint: `${targetRole}. ${currentQuestion?.question || ''}`.slice(0, 320),
      onAudioLevel: (lvl) => setMicLevel(lvl),
      onStatusText: (msg) => setVoiceStatusNote(msg),
      onInterimTranscript: (interim) => {
        setDraftAnswer(baseDraft ? `${baseDraft} ${interim}` : interim);
      },
    });
    speechControllerRef.current = controller;

    try {
      await controller.start();
      setIsRecording(true);
    } catch (err) {
      speechControllerRef.current = null;
      setIsRecording(false);
      setVoiceStatusNote(err instanceof Error ? err.message : 'Microphone access was denied or unavailable.');
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

  const submitCandidateMessage = async (
    overrideText?: string,
    options?: { fromVoice?: boolean }
  ) => {
    const trimmed = (overrideText ?? draftAnswer).trim();
    if (!trimmed || isInterviewerTyping || stage === 'debrief') return;

    if (isRecording && speechControllerRef.current) {
      speechControllerRef.current.abort();
      speechControllerRef.current = null;
      setIsRecording(false);
    }

    if (liveState === 'connected' && liveClientRef.current) {
      setTurns((prev) => [
        ...prev,
        {
          id: `turn-user-${crypto.randomUUID().slice(0, 8)}`,
          speaker: 'candidate',
          kind: 'answer',
          timestamp: new Date().toISOString(),
          questionId: currentQuestion?.id,
          text: trimmed,
        },
      ]);
      setDraftAnswer('');
      liveClientRef.current.sendTextTurn(trimmed);
      return;
    }

    const speakReply = Boolean(options?.fromVoice || voiceReadAloud);
    const candidateTurn: ConversationTurn = {
      id: `turn-user-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'candidate',
      kind: 'answer',
      timestamp: new Date().toISOString(),
      questionId: currentQuestion?.id,
      badge: options?.fromVoice ? 'Voice' : undefined,
      text: trimmed,
    };

    const nextTurnsSnapshot = [...turns, candidateTurn];
    setTurns(nextTurnsSnapshot);
    setDraftAnswer('');

    // Track tools mentioned across the session in candidate memory
    const toolsInReply = extractMentionedTools(trimmed);
    const updatedMemory: CandidateMemory = {
      ...memory,
      mentionedTools: [...new Set([...memory.mentionedTools, ...toolsInReply])],
      warmupSummary: stage === 'warmup' ? trimmed : memory.warmupSummary,
    };
    setMemory(updatedMemory);

    if (stage === 'awaiting_continue') {
      handleAdvanceToNextQuestion();
      return;
    }

    if (stage === 'warmup' && !currentQuestion) {
      handleFinishAndDebrief();
      return;
    }

    const recentHistoryText = nextTurnsSnapshot
      .slice(-6)
      .map((t) => `${t.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
      .join('\n')
      .slice(0, 5000);

    // Try Gemini AI conversational interviewer first (with automatic multi-model fallback in gateway),
    // and fall back cleanly to our deterministic interview engine whenever offline/demo/unavailable.
    if (!userId.startsWith('demo')) {
      setIsInterviewerTyping(true);
      try {
        const aiTurn = await requestInterviewTurn({
          stage: stage === 'warmup' ? 'warmup' : 'questioning',
          target_role: targetRole,
          experience_level: experienceLevel || difficultyPref,
          question: currentQuestion?.question || '',
          answer: trimmed,
          rubric: currentQuestion
            ? JSON.stringify({
                round: currentQuestion.round,
                expected_keywords: currentQuestion.expected_keywords,
              })
            : '',
          history: recentHistoryText,
          follow_up_count: followUpCount,
        });

        setIsInterviewerTyping(false);
        const resp = aiTurn.response;
        const persona = getInterviewerPersona(
          stage === 'warmup' ? 'Warmup' : currentQuestion?.round ?? 'Technical',
          targetRole
        );

        if (stage === 'warmup' && currentQuestion) {
          const qText = resp.reply.includes(currentQuestion.question.slice(0, 28))
            ? resp.reply
            : `${resp.reply}\n\nLet's begin Question 1 of ${loopQueue.length}: ${currentQuestion.question}`;
          const introTurn: ConversationTurn = {
            id: `turn-q-${crypto.randomUUID().slice(0, 8)}`,
            speaker: 'interviewer',
            kind: 'question',
            timestamp: new Date().toISOString(),
            questionId: currentQuestion.id,
            badge: `Q1 · ${currentQuestion.round} · Gemini AI`,
            interviewer: persona,
            text: qText,
          };
          setStage('questioning');
          setPaceSeconds(120);
          setIsPaceRunning(true);
          setTurns((prev) => [...prev, introTurn]);
          speakText(introTurn.text, speakReply);
          void onAIUsageChanged?.();
          return;
        }

        if (currentQuestion) {
          if (resp.action === 'clarify' || resp.action === 'ask_followup') {
            if (resp.action === 'ask_followup') {
              setUserTurnsForCurrentQ((prev) => [...prev, trimmed]);
              setFollowUpCount((prev) => prev + 1);
            }
            const followTurn: ConversationTurn = {
              id: `turn-ai-${crypto.randomUUID().slice(0, 8)}`,
              speaker: 'interviewer',
              kind: resp.action === 'clarify' ? 'clarification' : 'followup',
              timestamp: new Date().toISOString(),
              questionId: currentQuestion.id,
              badge: resp.action === 'clarify' ? 'Clarification · Gemini AI' : 'Follow-up · Gemini AI',
              interviewer: persona,
              text: resp.reply,
            };
            setTurns((prev) => [...prev, followTurn]);
            speakText(followTurn.text, speakReply);
            void onAIUsageChanged?.();
            return;
          }

          const combinedAnswer = [...userTurnsForCurrentQ, trimmed].join('\n\n');
          const evalSummary = evaluateQuestionExchange({
            question: currentQuestion,
            combinedAnswer,
            targetRole,
          });
          const mergedEval: QuestionEvaluationSummary = {
            ...evalSummary,
            strengths: resp.strengths && resp.strengths.length > 0 ? resp.strengths : evalSummary.strengths,
            growthTip: resp.growth_tip || evalSummary.growthTip,
            aiCritique: resp.critique || resp.reply,
          };

          setUserTurnsForCurrentQ((prev) => [...prev, trimmed]);
          setIsPaceRunning(false);
          setEvaluations((prev) => [...prev, mergedEval]);
          void persistCompletedAttempt(mergedEval);
          setStage('awaiting_continue');

          const evalTurn: ConversationTurn = {
            id: `turn-eval-${crypto.randomUUID().slice(0, 8)}`,
            speaker: 'coach',
            kind: 'evaluation',
            timestamp: new Date().toISOString(),
            questionId: currentQuestion.id,
            text: resp.reply,
            evaluation: mergedEval,
          };
          setTurns((prev) => [...prev, evalTurn]);
          speakText(resp.reply, speakReply);
          void onAIUsageChanged?.();
          return;
        }
      } catch {
        setIsInterviewerTyping(false);
        // Seamless automatic fallback to deterministic interview engine below
      }
    }

    if (stage === 'warmup') {
      scheduleInterviewerReply(() => {
        if (!currentQuestion) return;
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
        speakText(introTurn.text, speakReply);
      });
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
        speakText(outcome.interviewerTurn.text, speakReply);
        return;
      }

      if (outcome.action === 'ask_followup') {
        setUserTurnsForCurrentQ(updatedTurnsForQ);
        setFollowUpCount((prev) => prev + 1);
        setTurns((prev) => [...prev, outcome.interviewerTurn]);
        speakText(outcome.interviewerTurn.text, speakReply);
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
      speakText(outcome.interviewerTurn.text, speakReply);
    });
  };

  const handleSendMessage = () => {
    void submitCandidateMessage();
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
            {/* Gemini Live Voice Call Controls */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                maxWidth: '100%',
                gap: '6px',
                padding: '3px',
                borderRadius: '18px',
                border: liveState === 'connected' ? '1px solid #059669' : '1px solid var(--md-outline)',
                background: liveState === 'connected' ? 'rgba(5, 150, 105, 0.1)' : 'var(--md-surface-variant)',
              }}
            >
              <select
                aria-label="Choose interviewer human voice"
                value={liveVoice}
                disabled={liveState === 'connected' || liveState === 'connecting'}
                onChange={(e) => setLiveVoice(e.target.value as LiveVoiceName)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--md-text-primary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 6px 4px 10px',
                  maxWidth: '100%',
                  cursor: liveState === 'connected' ? 'default' : 'pointer',
                  outline: 'none',
                }}
              >
                {LIVE_VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void handleToggleLiveCall()}
                disabled={stage === 'debrief'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: liveState === 'connected' ? '#DC2626' : 'var(--md-primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {liveState === 'connected' ? <PhoneOff size={13} /> : <Phone size={13} />}
                <span>
                  {liveState === 'connecting'
                    ? 'Connecting…'
                    : liveState === 'connected'
                      ? 'End Live Call'
                      : 'Live Voice Call'}
                </span>
              </button>

              {liveState === 'connected' && (
                <button
                  type="button"
                  onClick={handleToggleLiveMute}
                  aria-label={isLiveMuted ? 'Unmute live microphone' : 'Mute live microphone'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '9999px',
                    border: '1px solid var(--md-outline)',
                    background: isLiveMuted ? 'var(--md-error-bg)' : 'var(--md-surface)',
                    color: isLiveMuted ? 'var(--md-error)' : 'var(--md-text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isLiveMuted ? <MicOff size={13} /> : <Mic size={13} />}
                  <span>{isLiveMuted ? 'Muted' : 'Mic On'}</span>
                </button>
              )}
            </div>

            {ttsSupported && liveState !== 'connected' && (
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

            {stage !== 'debrief' && (evaluations.length > 0 || stage === 'questioning' || turns.length > 1) && (
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

          {liveState === 'connected' && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(5, 150, 105, 0.35)',
                background: 'rgba(5, 150, 105, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669' }}>
                  ● Live Human Voice ({liveVoice} · {liveActiveModel || 'Gemini Live'})
                </span>
                <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                  {isLiveAiSpeaking ? 'Interviewer speaking (interrupt anytime)' : isLiveMuted ? 'Mic muted' : 'Listening… speak naturally'}
                </span>
              </div>
              <div style={{ height: '4px', width: '100%', borderRadius: '999px', background: 'var(--md-outline)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(4, Math.round(micLevel * 100))}%`,
                    background: isLiveMuted ? 'var(--md-text-muted)' : '#059669',
                    transition: 'width 80ms linear',
                  }}
                />
              </div>
              {liveUserCaption && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                  <strong>You:</strong> {liveUserCaption}
                </p>
              )}
              {liveAiCaption && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-primary)' }}>
                  <strong>Interviewer:</strong> {liveAiCaption}
                </p>
              )}
            </div>
          )}

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
            {voiceStatusNote && (
              <div
                role="status"
                style={{
                  marginBottom: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--md-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span>{voiceStatusNote}</span>
                {isRecording && (
                  <span style={{ display: 'inline-block', width: '64px', height: '5px', borderRadius: '999px', background: 'var(--md-outline)', overflow: 'hidden', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: `${Math.max(10, Math.round(micLevel * 100))}%`,
                        background: 'var(--md-error)',
                        transition: 'width 80ms linear',
                      }}
                    />
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {speechSupported && liveState !== 'connected' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void toggleRecording()}
                      disabled={isInterviewerTyping || isTranscribingVoice}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isRecording ? '1px solid var(--md-error)' : '1px solid var(--md-outline)',
                        background: isRecording ? 'var(--md-error-bg)' : 'var(--md-surface)',
                        color: isRecording ? 'var(--md-error)' : 'var(--md-text-primary)',
                        cursor: isTranscribingVoice ? 'wait' : 'pointer',
                      }}
                    >
                      {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
                      <span>
                        {isTranscribingVoice
                          ? 'Transcribing…'
                          : isRecording
                            ? autoSendVoice
                              ? 'Stop & Send Voice'
                              : 'Stop Listening'
                            : 'Speak Answer'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoSendVoice((prev) => !prev)}
                      title="When enabled, finishing Speak Answer automatically transcribes and sends your reply to the AI interviewer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: autoSendVoice ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                        background: autoSendVoice ? 'var(--md-primary-container)' : 'var(--md-surface)',
                        color: autoSendVoice ? 'var(--md-on-primary-container)' : 'var(--md-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Auto-send voice: {autoSendVoice ? 'On' : 'Off'}</span>
                    </button>
                  </>
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

            <div className="iv-composer-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
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
                className="btn-m3-primary iv-send-btn"
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
