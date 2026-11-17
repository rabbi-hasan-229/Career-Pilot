import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  HelpCircle,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneOff,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  requestInterviewTurn,
  requestLiveInterviewToken,
  synthesizeInterviewSpeech,
  type LiveVoiceName,
} from '../features/ai/aiGateway';
import {
  getQuestionCoachingHint,
  type CuratedInterviewQuestion,
} from '../features/interview/curatedInterviewCatalog';
import {
  GeminiLiveSessionClient,
  playGeminiAudioBase64,
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

type SessionStage = 'warmup' | 'questioning' | 'awaiting_continue' | 'debrief';

const FOCUS_OPTIONS: Array<{ value: InterviewFocusMode; label: string }> = [
  { value: 'Mixed', label: 'Realistic Loop' },
  { value: 'Behavioral', label: 'Behavioral' },
  { value: 'Technical', label: 'Technical' },
  { value: 'System Design', label: 'System Design' },
];

const DIFFICULTY_OPTIONS: DifficultyPreference[] = ['Adaptive', 'Junior', 'Mid', 'Senior'];

const LIVE_VOICE_OPTIONS: Array<{ id: LiveVoiceName; label: string }> = [
  { id: 'Kore', label: 'Kore' },
  { id: 'Aoede', label: 'Aoede' },
  { id: 'Puck', label: 'Puck' },
  { id: 'Charon', label: 'Charon' },
  { id: 'Fenrir', label: 'Fenrir' },
];

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const selectPillStyle: React.CSSProperties = {
  border: '1px solid var(--md-outline)',
  borderRadius: '9999px',
  background: 'var(--md-surface-variant)',
  color: 'var(--md-text-primary)',
  fontSize: '12px',
  fontWeight: 600,
  padding: '6px 12px',
  cursor: 'pointer',
  outline: 'none',
};

const subtlePillBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 11px',
  borderRadius: '9999px',
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface)',
  color: 'var(--md-text-secondary)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

export const InterviewSimulatorView: React.FC<Props> = ({
  userId,
  targetRole,
  targetRoleCategory,
  experienceLevel,
  userName,
  onAIUsageChanged,
}) => {
  const isDemoUser = userId.startsWith('demo');
  const resolvedCategory = useMemo(
    () => targetRoleCategory ?? getOrCreateCareerBlueprint(targetRole).category,
    [targetRole, targetRoleCategory]
  );
  const firstName = useMemo(() => extractFirstName(userName), [userName]);

  // Setup & session state
  const [loading, setLoading] = useState(true);
  const [remoteQuestions, setRemoteQuestions] = useState<CuratedInterviewQuestion[]>([]);
  const [focusMode, setFocusMode] = useState<InterviewFocusMode>('Mixed');
  const [difficultyPref, setDifficultyPref] = useState<DifficultyPreference>('Adaptive');

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

  // Composer & feedback state
  const [draftAnswer, setDraftAnswer] = useState('');
  const [isInterviewerTyping, setIsInterviewerTyping] = useState(false);
  const [expandedSampleIds, setExpandedSampleIds] = useState<Record<string, boolean>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastFailedTurnText, setLastFailedTurnText] = useState<string | null>(null);

  // Voice input + Gemini TTS voice output state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [voiceStatusNote, setVoiceStatusNote] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceReadAloud, setVoiceReadAloud] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  // Gemini Live real-time audio call state
  const [liveState, setLiveState] = useState<LiveSessionState>('idle');
  const [liveVoice, setLiveVoice] = useState<LiveVoiceName>('Kore');
  const [isLiveMuted, setIsLiveMuted] = useState(false);
  const [isLiveAiSpeaking, setIsLiveAiSpeaking] = useState(false);
  const [liveUserCaption, setLiveUserCaption] = useState('');
  const [liveAiCaption, setLiveAiCaption] = useState('');

  // Subtle pacing timer (active only during questioning)
  const [paceSeconds, setPaceSeconds] = useState(120);
  const [isPaceRunning, setIsPaceRunning] = useState(false);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speechControllerRef = useRef<HybridSpeechController | null>(null);
  const liveClientRef = useRef<GeminiLiveSessionClient | null>(null);
  const stopTtsAudioRef = useRef<(() => void) | null>(null);
  const ttsNonceRef = useRef(0);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const thinkingTimerRef = useRef<number | null>(null);

  // Latest state refs so Live Voice callbacks never read stale closures
  const turnsRef = useRef<ConversationTurn[]>(turns);
  const currentQuestionRef = useRef<CuratedInterviewQuestion | null>(null);
  const liveUsedRef = useRef(false);

  const currentQuestion = loopQueue[currentIndex] ?? null;
  turnsRef.current = turns;
  currentQuestionRef.current = currentQuestion;

  const stopAllSpeechOutput = () => {
    ttsNonceRef.current += 1;
    if (stopTtsAudioRef.current) {
      stopTtsAudioRef.current();
      stopTtsAudioRef.current = null;
    }
    setIsSpeakingAudio(false);
    if (ttsSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  };

  const speakInterviewerText = async (text: string, forceSpeak = false) => {
    const cleanText = text.replace(/\n+/g, ' ').trim();
    if (!cleanText || (!voiceReadAloud && !forceSpeak) || liveState === 'connected') return;

    stopAllSpeechOutput();
    const myNonce = ttsNonceRef.current;

    // Prefer Gemini natural human speech for signed-in users
    if (!isDemoUser) {
      try {
        setIsSpeakingAudio(true);
        const ttsRes = await synthesizeInterviewSpeech({
          text: cleanText.slice(0, 1400),
          voice_name: liveVoice,
        });
        if (ttsNonceRef.current !== myNonce) return;
        const stopHandle = await playGeminiAudioBase64(
          ttsRes.response.audio_base64,
          ttsRes.response.mime_type,
          () => {
            if (ttsNonceRef.current === myNonce) {
              stopTtsAudioRef.current = null;
              setIsSpeakingAudio(false);
            }
          }
        );
        if (ttsNonceRef.current !== myNonce) {
          stopHandle();
          return;
        }
        stopTtsAudioRef.current = stopHandle;
        void onAIUsageChanged?.();
        return;
      } catch {
        if (ttsNonceRef.current !== myNonce) return;
        setIsSpeakingAudio(false);
      }
    }

    // Fallback to browser SpeechSynthesis only if demo/offline or Gemini TTS unavailable
    if (ttsSupported) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.99;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeakingAudio(false);
        utterance.onerror = () => setIsSpeakingAudio(false);
        setIsSpeakingAudio(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeakingAudio(false);
      }
    }
  };

  useEffect(() => {
    if (!voiceReadAloud) {
      stopAllSpeechOutput();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceReadAloud]);

  useEffect(() => {
    setSpeechSupported(isVoiceCaptureSupported());
    return () => {
      if (thinkingTimerRef.current) window.clearTimeout(thinkingTimerRef.current);
      speechControllerRef.current?.abort();
      speechControllerRef.current = null;
      void liveClientRef.current?.disconnect();
      liveClientRef.current = null;
      stopAllSpeechOutput();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    overrideRemote: CuratedInterviewQuestion[] = remoteQuestions
  ) => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    stopAllSpeechOutput();
    if (liveState === 'connected' || liveState === 'connecting') {
      void liveClientRef.current?.disconnect();
      liveClientRef.current = null;
      setLiveState('idle');
      setIsLiveMuted(false);
      setIsLiveAiSpeaking(false);
      setLiveUserCaption('');
      setLiveAiCaption('');
    }
    liveUsedRef.current = false;

    setIsInterviewerTyping(false);
    setDraftAnswer('');
    setFollowUpCount(0);
    setUserTurnsForCurrentQ([]);
    setEvaluations([]);
    setSessionDebrief(null);
    setErrorBanner(null);
    setLastFailedTurnText(null);
    setVoiceStatusNote('');
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

    const queue = buildInterviewLoopQueue({
      category: resolvedCategory,
      targetRole,
      focusMode: overrideFocus,
      difficulty: overrideDifficulty,
      experienceLevel,
      remoteQuestions: overrideRemote,
      count: 4,
    });

    setLoopQueue(queue);
    setCurrentIndex(0);

    const greeting = buildOpeningGreetingTurn(freshMemory, overrideFocus);
    setStage('warmup');
    setTurns([greeting]);
    void speakInterviewerText(greeting.text);
  };

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
        // Curated catalog remains available
      }

      if (!active) return;
      setRemoteQuestions(loadedRemote);
      setLoading(false);
    };
    void init();
    return () => {
      active = false;
    };
  }, [userId, resolvedCategory]);

  useEffect(() => {
    if (!loading) {
      startNewSession(focusMode, difficultyPref, remoteQuestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, targetRole, resolvedCategory]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns.length, isInterviewerTyping, sessionDebrief]);

  const persistCompletedAttempt = async (summary: QuestionEvaluationSummary) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(summary.questionId);
    if (isUuid && !isDemoUser) {
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
        // Non-blocking persistence
      }
    }
  };

  const scheduleDemoReply = (fn: () => void) => {
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
    void speakInterviewerText(introTurn.text);
  };

  const handleAdvanceToNextQuestion = () => {
    if (isInterviewerTyping) return;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= loopQueue.length) {
      void handleFinishAndDebrief();
      return;
    }

    const nextQ = loopQueue[nextIdx];
    setCurrentIndex(nextIdx);
    setFollowUpCount(0);
    setUserTurnsForCurrentQ([]);
    setStage('questioning');
    setPaceSeconds(120);
    setIsPaceRunning(true);
    setErrorBanner(null);

    const nextTurn = buildQuestionIntroTurn({
      question: nextQ,
      questionIndex: nextIdx,
      totalQuestions: loopQueue.length,
      memory,
    });

    setTurns((prev) => [...prev, nextTurn]);
    void speakInterviewerText(nextTurn.text);
  };

  const handleFinishAndDebrief = async () => {
    if (isInterviewerTyping) return;
    setIsPaceRunning(false);
    setErrorBanner(null);

    if (liveState === 'connected' || liveState === 'connecting') {
      await liveClientRef.current?.disconnect();
      liveClientRef.current = null;
      setLiveState('idle');
      setIsLiveMuted(false);
      setIsLiveAiSpeaking(false);
      setLiveUserCaption('');
      setLiveAiCaption('');
    }

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

    const currentTurns = turnsRef.current;
    const hasConversationContent = currentTurns.some((t) => t.speaker === 'candidate');

    // Generate a smart Gemini debrief whenever signed in and the candidate spoke/replied
    if (!isDemoUser && hasConversationContent) {
      setIsInterviewerTyping(true);
      try {
        const transcript = currentTurns
          .filter((t) => t.kind !== 'debrief')
          .slice(-24)
          .map((t) => `${t.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
          .join('\n')
          .slice(0, 9500);

        const aiDebrief = await requestInterviewTurn({
          stage: 'debrief',
          target_role: targetRole,
          experience_level: experienceLevel || difficultyPref,
          focus_mode: focusMode,
          question: currentQuestion?.question || '',
          answer: 'Generate the final hiring manager debrief for this interview session.',
          history: transcript,
        });

        const resp = aiDebrief.response;
        const fallbackDebrief = buildSessionDebrief(allEvaluations, memory);
        const debrief: SessionDebrief = {
          overallScore: resp.overall_score ?? fallbackDebrief.overallScore,
          readinessLabel: resp.readiness_label ?? fallbackDebrief.readinessLabel,
          summaryNote: resp.reply || fallbackDebrief.summaryNote,
          dimensions: resp.dimensions && resp.dimensions.length > 0 ? resp.dimensions : fallbackDebrief.dimensions,
          topStrengths: resp.strengths && resp.strengths.length > 0 ? resp.strengths : fallbackDebrief.topStrengths,
          priorityImprovements:
            resp.priority_improvements && resp.priority_improvements.length > 0
              ? resp.priority_improvements
              : fallbackDebrief.priorityImprovements,
          questionsCompleted: Math.max(allEvaluations.length, liveUsedRef.current ? 1 : 0),
        };

        setIsInterviewerTyping(false);
        setSessionDebrief(debrief);
        setStage('debrief');
        const closingTurn: ConversationTurn = {
          id: `turn-debrief-${crypto.randomUUID().slice(0, 8)}`,
          speaker: 'coach',
          kind: 'debrief',
          timestamp: new Date().toISOString(),
          text: debrief.summaryNote,
          debrief,
        };
        setTurns((prev) => [...prev, closingTurn]);
        void speakInterviewerText(debrief.summaryNote);
        void onAIUsageChanged?.();
        return;
      } catch {
        setIsInterviewerTyping(false);
        // Fall through cleanly to local debrief summary
      }
    }

    const debrief = buildSessionDebrief(allEvaluations, memory);
    setSessionDebrief(debrief);
    setStage('debrief');

    const closingTurn: ConversationTurn = {
      id: `turn-debrief-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'coach',
      kind: 'debrief',
      timestamp: new Date().toISOString(),
      text: debrief.summaryNote,
      debrief,
    };
    setTurns((prev) => [...prev, closingTurn]);
    void speakInterviewerText(debrief.summaryNote);
  };

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
        void handleAskForHint();
        return true;
      }
      return false;
    }
    if (command === 'repeat') {
      const lastInterviewerTurn = [...turnsRef.current].reverse().find((t) => t.speaker === 'interviewer');
      if (lastInterviewerTurn) {
        if (liveState === 'connected' && liveClientRef.current) {
          liveClientRef.current.sendTextTurn('Could you please repeat your last question concisely?');
        } else {
          void speakInterviewerText(lastInterviewerTurn.text, true);
          setVoiceStatusNote('Repeating interviewer prompt.');
        }
        return true;
      }
      return false;
    }
    if (command === 'end') {
      if (stage !== 'debrief') {
        void handleFinishAndDebrief();
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
    setVoiceStatusNote(nextMuted ? 'Microphone muted.' : 'Listening… speak naturally.');
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
      setVoiceStatusNote('');
      return;
    }

    if (isDemoUser) {
      setErrorBanner('Sign in with your account to start a live Gemini voice call. You can still practice below.');
      return;
    }

    if (isRecording && speechControllerRef.current) {
      speechControllerRef.current.abort();
      speechControllerRef.current = null;
      setIsRecording(false);
    }

    stopAllSpeechOutput();
    setErrorBanner(null);
    setVoiceStatusNote('Connecting live voice interviewer…');
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
        `You are Maya Chen, a warm, sharp, perceptive hiring manager conducting a live spoken mock interview for a ${targetRole} candidate.`,
        firstName ? `The candidate's name is ${firstName}. Address them as ${firstName}.` : '',
        experienceLevel ? `Calibrate expectations to ${experienceLevel} level (${difficultyPref}).` : '',
        `Focus: ${focusMode}. Speak naturally in crisp spoken sentences (2-4 sentences per turn), acknowledge specifics the candidate says, probe tradeoffs and impact with insightful follow-ups, and move cleanly through these interview topics one at a time:`,
        questionSummary,
        'Always respond verbally in a realistic conversational cadence. Never read markdown or long bullet lists aloud.',
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
        onModelActive: () => {
          liveUsedRef.current = true;
          setVoiceStatusNote('');
        },
        onMicLevel: (level) => setMicLevel(level),
        onSpeakingStateChange: (speaking) => setIsLiveAiSpeaking(speaking),
        onUserTranscriptChunk: (partial) => setLiveUserCaption(partial),
        onInterviewerTranscriptChunk: (partial) => setLiveAiCaption(partial),
        onUserTurnCommitted: (finalText) => {
          const clean = finalText.trim();
          if (!clean) return;
          const activeQ = currentQuestionRef.current;
          setTurns((prev) => [
            ...prev,
            {
              id: `turn-live-user-${crypto.randomUUID().slice(0, 8)}`,
              speaker: 'candidate',
              kind: 'answer',
              timestamp: new Date().toISOString(),
              questionId: activeQ?.id,
              text: clean,
            },
          ]);
          const cmd = parseVoiceCommand(clean);
          if (cmd && (cmd.type === 'end' || cmd.type === 'restart')) {
            executeVoiceCommand(cmd.type);
          }
        },
        onInterviewerTurnCommitted: (finalText) => {
          const clean = finalText.trim();
          if (!clean) return;
          const activeQ = currentQuestionRef.current;
          const persona = getInterviewerPersona(activeQ?.round ?? 'Warmup', targetRole);
          setTurns((prev) => [
            ...prev,
            {
              id: `turn-live-ai-${crypto.randomUUID().slice(0, 8)}`,
              speaker: 'interviewer',
              kind: 'question',
              timestamp: new Date().toISOString(),
              questionId: activeQ?.id,
              interviewer: persona,
              text: clean,
            },
          ]);
        },
        onError: (msg) => {
          setErrorBanner(msg);
          setVoiceStatusNote('');
        },
      });

      liveClientRef.current = client;
      const openerContext = stage === 'warmup'
        ? `Greet ${firstName || 'the candidate'} warmly for a ${targetRole} mock interview and invite a quick 30-second intro before Question 1.`
        : `Acknowledge we are continuing in live voice on Question ${currentIndex + 1}: "${currentQuestion?.question || ''}" and invite their thoughts.`;

      await client.connect({
        ephemeralToken: tokenRes.response.token,
        apiVersion: tokenRes.response.api_version,
        models: tokenRes.response.live_models,
        voiceName: liveVoice,
        systemInstruction,
        initialPrompt: openerContext,
      });

      await onAIUsageChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start live voice conversation.';
      setErrorBanner(message);
      setVoiceStatusNote('');
      setLiveState('idle');
      liveClientRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (isTranscribingVoice || isInterviewerTyping) return;

    if (isRecording && speechControllerRef.current) {
      setIsRecording(false);
      setIsTranscribingVoice(true);
      setVoiceStatusNote('Transcribing voice…');
      try {
        const result = await speechControllerRef.current.stop();
        speechControllerRef.current = null;
        setMicLevel(0);

        const transcript = result.transcript.trim();
        if (!transcript) {
          setVoiceStatusNote('No clear speech detected — please speak closer to your mic and try again.');
          return;
        }

        const matchedCommand = parseVoiceCommand(transcript);
        if (matchedCommand) {
          setVoiceStatusNote(matchedCommand.label);
          if (executeVoiceCommand(matchedCommand.type)) return;
        }

        setVoiceStatusNote('');
        if (!voiceReadAloud) {
          setVoiceReadAloud(true);
        }
        await submitCandidateMessage(transcript, { fromVoice: true });
      } catch {
        setVoiceStatusNote('Could not finish transcription. Please type or try again.');
      } finally {
        setIsTranscribingVoice(false);
      }
      return;
    }

    stopAllSpeechOutput();
    setErrorBanner(null);

    const baseDraft = draftAnswer.trim();
    const controller = createHybridSpeechController({
      preferGeminiTranscription: !isDemoUser,
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

  const submitCandidateMessage = async (
    overrideText?: string,
    options?: { fromVoice?: boolean; isRetry?: boolean }
  ) => {
    const trimmed = (overrideText ?? draftAnswer).trim();
    if (!trimmed || isInterviewerTyping || stage === 'debrief') return;

    if (isRecording && speechControllerRef.current) {
      speechControllerRef.current.abort();
      speechControllerRef.current = null;
      setIsRecording(false);
    }
    stopAllSpeechOutput();
    setErrorBanner(null);
    setLastFailedTurnText(null);

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
    let nextTurnsSnapshot = turnsRef.current;

    if (!options?.isRetry) {
      const candidateTurn: ConversationTurn = {
        id: `turn-user-${crypto.randomUUID().slice(0, 8)}`,
        speaker: 'candidate',
        kind: 'answer',
        timestamp: new Date().toISOString(),
        questionId: currentQuestion?.id,
        text: trimmed,
      };
      nextTurnsSnapshot = [...turnsRef.current, candidateTurn];
      setTurns(nextTurnsSnapshot);
      setDraftAnswer('');
    }

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
      void handleFinishAndDebrief();
      return;
    }

    const recentHistoryText = nextTurnsSnapshot
      .slice(-8)
      .map((t) => `${t.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
      .join('\n')
      .slice(0, 7500);

    // Signed-in users always use real Gemini intelligence via ai-gateway
    if (!isDemoUser) {
      setIsInterviewerTyping(true);
      try {
        const aiTurn = await requestInterviewTurn({
          stage: stage === 'warmup' ? 'warmup' : 'questioning',
          target_role: targetRole,
          experience_level: experienceLevel || difficultyPref,
          focus_mode: focusMode,
          candidate_name: firstName || '',
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
          const introTurn: ConversationTurn = {
            id: `turn-q-${crypto.randomUUID().slice(0, 8)}`,
            speaker: 'interviewer',
            kind: 'question',
            timestamp: new Date().toISOString(),
            questionId: currentQuestion.id,
            interviewer: persona,
            text: resp.reply,
          };
          setStage('questioning');
          setPaceSeconds(120);
          setIsPaceRunning(true);
          setTurns((prev) => [...prev, introTurn]);
          void speakInterviewerText(introTurn.text, speakReply);
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
              interviewer: persona,
              text: resp.reply,
            };
            setTurns((prev) => [...prev, followTurn]);
            void speakInterviewerText(followTurn.text, speakReply);
            void onAIUsageChanged?.();
            return;
          }

          const combinedAnswer = [...userTurnsForCurrentQ, trimmed].join('\n\n');
          const heuristicBase = evaluateQuestionExchange({
            question: currentQuestion,
            combinedAnswer,
            targetRole,
          });
          const aiScore = typeof resp.score === 'number' ? resp.score : heuristicBase.score;
          const aiSignal = resp.signal_label
            ?? (aiScore >= 78 ? 'Strong Signal' : aiScore >= 56 ? 'Solid Foundation' : 'Developing');

          const mergedEval: QuestionEvaluationSummary = {
            ...heuristicBase,
            score: aiScore,
            signalLabel: aiSignal,
            strengths: resp.strengths && resp.strengths.length > 0 ? resp.strengths : heuristicBase.strengths,
            growthTip: resp.growth_tip || heuristicBase.growthTip,
            aiCritique: resp.critique || '',
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
          void speakInterviewerText(resp.reply, speakReply);
          void onAIUsageChanged?.();
          return;
        }
      } catch (err) {
        setIsInterviewerTyping(false);
        const msg = err instanceof Error ? err.message : 'Could not reach the Gemini interviewer right now.';
        setErrorBanner(msg);
        setLastFailedTurnText(trimmed);
        return;
      }
    }

    // Demo-only deterministic fallback
    if (stage === 'warmup') {
      scheduleDemoReply(() => {
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
        void speakInterviewerText(introTurn.text, speakReply);
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

    scheduleDemoReply(() => {
      if (outcome.action === 'clarify') {
        setTurns((prev) => [...prev, outcome.interviewerTurn]);
        void speakInterviewerText(outcome.interviewerTurn.text, speakReply);
        return;
      }

      if (outcome.action === 'ask_followup') {
        setUserTurnsForCurrentQ(updatedTurnsForQ);
        setFollowUpCount((prev) => prev + 1);
        setTurns((prev) => [...prev, outcome.interviewerTurn]);
        void speakInterviewerText(outcome.interviewerTurn.text, speakReply);
        return;
      }

      setUserTurnsForCurrentQ(updatedTurnsForQ);
      setIsPaceRunning(false);
      if (outcome.evaluation) {
        setEvaluations((prev) => [...prev, outcome.evaluation!]);
        void persistCompletedAttempt(outcome.evaluation);
      }
      setStage('awaiting_continue');
      setTurns((prev) => [...prev, outcome.interviewerTurn]);
      void speakInterviewerText(outcome.interviewerTurn.text, speakReply);
    });
  };

  const handleAskForHint = async () => {
    if (!currentQuestion || stage !== 'questioning' || isInterviewerTyping) return;
    setErrorBanner(null);

    if (!isDemoUser) {
      setIsInterviewerTyping(true);
      try {
        const recentHistory = turnsRef.current
          .slice(-6)
          .map((t) => `${t.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}: ${t.text}`)
          .join('\n')
          .slice(0, 6000);
        const aiHint = await requestInterviewTurn({
          stage: 'questioning',
          target_role: targetRole,
          experience_level: experienceLevel || difficultyPref,
          focus_mode: focusMode,
          question: currentQuestion.question,
          answer: '[REQUEST_STEER] Can you give me a quick hint on how to structure this?',
          history: recentHistory,
          follow_up_count: followUpCount,
        });
        setIsInterviewerTyping(false);
        const persona = getInterviewerPersona(currentQuestion.round, targetRole);
        const hintTurn: ConversationTurn = {
          id: `turn-hint-${crypto.randomUUID().slice(0, 8)}`,
          speaker: 'interviewer',
          kind: 'clarification',
          timestamp: new Date().toISOString(),
          questionId: currentQuestion.id,
          interviewer: persona,
          text: aiHint.response.reply,
        };
        setTurns((prev) => [...prev, hintTurn]);
        void speakInterviewerText(hintTurn.text);
        void onAIUsageChanged?.();
        return;
      } catch {
        setIsInterviewerTyping(false);
      }
    }

    const hintText = getQuestionCoachingHint(currentQuestion, targetRole);
    const hintTurn: ConversationTurn = {
      id: `turn-hint-${crypto.randomUUID().slice(0, 8)}`,
      speaker: 'interviewer',
      kind: 'clarification',
      timestamp: new Date().toISOString(),
      questionId: currentQuestion.id,
      interviewer: turns.find((t) => t.questionId === currentQuestion.id && t.interviewer)?.interviewer,
      text: `Here is how I'd frame this if we were pairing: ${hintText}`,
    };
    setTurns((prev) => [...prev, hintTurn]);
    void speakInterviewerText(hintTurn.text);
  };

  const handleSelectFocusMode = (mode: InterviewFocusMode) => {
    setFocusMode(mode);
    startNewSession(mode, difficultyPref, remoteQuestions);
  };

  const handleSelectDifficulty = (diff: DifficultyPreference) => {
    setDifficultyPref(diff);
    startNewSession(focusMode, diff, remoteQuestions);
  };

  if (loading) {
    return <InterviewSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Clean Single-Row Studio Header */}
      <div
        className="m3-surface-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--md-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Mock Interview
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)', fontWeight: 500 }}>
            {targetRole}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            aria-label="Interview format"
            value={focusMode}
            disabled={liveState === 'connected' || liveState === 'connecting'}
            onChange={(e) => handleSelectFocusMode(e.target.value as InterviewFocusMode)}
            style={selectPillStyle}
          >
            {FOCUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Interview level"
            value={difficultyPref}
            disabled={liveState === 'connected' || liveState === 'connecting'}
            onChange={(e) => handleSelectDifficulty(e.target.value as DifficultyPreference)}
            style={selectPillStyle}
          >
            {DIFFICULTY_OPTIONS.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>

          <select
            aria-label="Interviewer voice"
            value={liveVoice}
            disabled={liveState === 'connected' || liveState === 'connecting'}
            onChange={(e) => setLiveVoice(e.target.value as LiveVoiceName)}
            style={selectPillStyle}
          >
            {LIVE_VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                Voice: {v.label}
              </option>
            ))}
          </select>

          {liveState !== 'connected' && (
            <button
              type="button"
              onClick={() => setVoiceReadAloud((prev) => !prev)}
              title={voiceReadAloud ? 'Mute spoken interviewer replies' : 'Speak interviewer replies aloud'}
              style={{
                ...subtlePillBtnStyle,
                padding: '6px 12px',
                border: voiceReadAloud ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                background: voiceReadAloud ? 'var(--md-primary-container)' : 'var(--md-surface)',
                color: voiceReadAloud ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
              }}
            >
              {voiceReadAloud ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{isSpeakingAudio ? 'Speaking…' : voiceReadAloud ? 'Voice On' : 'Voice Off'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleToggleLiveCall()}
            disabled={stage === 'debrief'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: liveState === 'connected' ? '#DC2626' : 'var(--md-primary)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: stage === 'debrief' ? 'not-allowed' : 'pointer',
              opacity: stage === 'debrief' ? 0.55 : 1,
            }}
          >
            {liveState === 'connected' ? <PhoneOff size={13} /> : <Phone size={13} />}
            <span>
              {liveState === 'connecting'
                ? 'Connecting…'
                : liveState === 'connected'
                  ? 'End Call'
                  : 'Live Voice Call'}
            </span>
          </button>

          {liveState === 'connected' && (
            <button
              type="button"
              onClick={handleToggleLiveMute}
              aria-label={isLiveMuted ? 'Unmute microphone' : 'Mute microphone'}
              style={{
                ...subtlePillBtnStyle,
                padding: '6px 12px',
                background: isLiveMuted ? 'var(--md-error-bg)' : 'var(--md-surface)',
                color: isLiveMuted ? 'var(--md-error)' : 'var(--md-text-primary)',
              }}
            >
              {isLiveMuted ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{isLiveMuted ? 'Muted' : 'Mic On'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => startNewSession(focusMode, difficultyPref, remoteQuestions)}
            title="Start a fresh interview session"
            style={{ ...subtlePillBtnStyle, padding: '6px 12px' }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Conversational Interview Room */}
      <div className="m3-surface-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Minimal Status Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--md-outline)',
            background: 'var(--md-surface-variant)',
          }}
        >
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
            {liveState === 'connected'
              ? `Live Voice Interview · ${targetRole}`
              : stage === 'warmup'
                ? 'Introduction'
                : stage === 'debrief'
                  ? 'Session Debrief'
                  : `Question ${currentIndex + 1} of ${loopQueue.length} · ${currentQuestion?.round ?? ''}`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {liveState !== 'connected' && stage !== 'warmup' && stage !== 'debrief' && (
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
                  aria-label={isPaceRunning ? 'Pause timer' : 'Resume timer'}
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

            {stage !== 'debrief' && (evaluations.length > 0 || stage === 'questioning' || turns.length > 1 || liveState === 'connected') && (
              <button
                type="button"
                onClick={() => void handleFinishAndDebrief()}
                disabled={isInterviewerTyping}
                style={{ ...subtlePillBtnStyle, color: 'var(--md-text-primary)' }}
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
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '300px',
            maxHeight: '520px',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Feedback · {ev.round}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--md-text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
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
                        flexShrink: 0,
                      }}
                    >
                      {ev.signalLabel} · {ev.score}%
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Strengths
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.5 }}>
                        {ev.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Next Improvement
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.5 }}>
                        {ev.growthTip}
                      </p>
                    </div>
                  </div>

                  {ev.aiCritique && (
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-secondary)', lineHeight: 1.55 }}>
                      {ev.aiCritique}
                    </p>
                  )}

                  {isSampleOpen && (
                    <div style={{ background: 'var(--md-surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--md-outline)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Strong Sample Answer
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-primary)', lineHeight: 1.55 }}>
                        {ev.modelAnswer}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSampleIds((prev) => ({
                          ...prev,
                          [ev.questionId]: !prev[ev.questionId],
                        }))
                      }
                      style={subtlePillBtnStyle}
                    >
                      {isSampleOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      <span>{isSampleOpen ? 'Hide sample answer' : 'View sample answer'}</span>
                    </button>

                    {stage === 'awaiting_continue' && currentQuestion?.id === ev.questionId && (
                      <button
                        type="button"
                        className="btn-m3-primary"
                        onClick={handleAdvanceToNextQuestion}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12.5px' }}
                      >
                        <span>
                          {currentIndex + 1 >= loopQueue.length
                            ? 'View Final Debrief'
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
                    padding: '20px',
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
                        Next Focus Areas
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
                      <span>Start New Session</span>
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
                  </div>
                )}

                {isCandidate && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)', marginBottom: '4px' }}>
                    {firstName || 'You'}
                  </span>
                )}

                <div
                  style={{
                    maxWidth: '85%',
                    padding: '13px 17px',
                    borderRadius: isCandidate ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    border: isCandidate ? '1px solid rgba(18, 60, 105, 0.2)' : '1px solid var(--md-outline)',
                    background: isCandidate ? 'var(--md-primary-container)' : 'var(--md-surface)',
                    color: isCandidate ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)',
                    fontSize: '14px',
                    lineHeight: 1.6,
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
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                  ● Live Voice Active ({liveVoice})
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                  {isLiveAiSpeaking ? 'Maya is speaking (interrupt anytime)' : isLiveMuted ? 'Mic muted' : 'Listening… speak naturally'}
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
                  <strong>Maya:</strong> {liveAiCaption}
                </p>
              )}
            </div>
          )}

          {isInterviewerTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
              <span className="skeleton-box" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
              <span style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', fontStyle: 'italic' }}>
                Maya is thinking…
              </span>
            </div>
          )}

          {errorBanner && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(220, 38, 38, 0.35)',
                background: 'rgba(220, 38, 38, 0.07)',
                color: 'var(--md-text-primary)',
                fontSize: '12.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>{errorBanner}</span>
              </div>
              {lastFailedTurnText && (
                <button
                  type="button"
                  onClick={() => void submitCandidateMessage(lastFailedTurnText, { isRetry: true })}
                  style={{ ...subtlePillBtnStyle, color: 'var(--md-primary)' }}
                >
                  <RotateCcw size={12} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Clean Composer */}
        {stage !== 'debrief' && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
            }}
          >
            {voiceStatusNote && (
              <div
                role="status"
                style={{
                  marginBottom: '8px',
                  fontSize: '12px',
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
                        background: '#DC2626',
                        transition: 'width 80ms linear',
                      }}
                    />
                  </span>
                )}
              </div>
            )}

            <div className="iv-composer-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                id="interview-answer"
                rows={2}
                value={draftAnswer}
                maxLength={6000}
                disabled={isInterviewerTyping}
                onChange={(e) => setDraftAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submitCandidateMessage();
                  }
                }}
                placeholder={
                  liveState === 'connected'
                    ? 'Speak directly into your mic, or type a note here…'
                    : stage === 'warmup'
                      ? 'Share a quick overview of what you built or worked on recently…'
                      : stage === 'awaiting_continue'
                        ? 'Click Continue above, or press Enter to move to the next question…'
                        : followUpCount > 0
                          ? 'Respond to the follow-up…'
                          : 'Explain your approach, tradeoffs, and measurable outcome…'
                }
                style={{
                  flex: 1,
                  padding: '11px 14px',
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

              {speechSupported && liveState !== 'connected' && (
                <button
                  type="button"
                  onClick={() => void toggleRecording()}
                  disabled={isInterviewerTyping || isTranscribingVoice}
                  title={isRecording ? 'Stop recording and send' : 'Speak your answer'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '11px 14px',
                    minHeight: '44px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: isRecording ? '1px solid #DC2626' : '1px solid var(--md-outline)',
                    background: isRecording ? 'rgba(220, 38, 38, 0.12)' : 'var(--md-surface)',
                    color: isRecording ? '#DC2626' : 'var(--md-text-primary)',
                    cursor: isTranscribingVoice ? 'wait' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isTranscribingVoice ? 'Transcribing…' : isRecording ? 'Stop & Send' : 'Speak'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn-m3-primary iv-send-btn"
                onClick={() => void submitCandidateMessage()}
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

            {liveState !== 'connected' && (stage === 'warmup' || stage === 'questioning') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {stage === 'warmup' && (
                  <button
                    type="button"
                    onClick={handleSkipWarmup}
                    disabled={isInterviewerTyping}
                    style={subtlePillBtnStyle}
                  >
                    <SkipForward size={12} />
                    <span>Skip to Question 1</span>
                  </button>
                )}

                {stage === 'questioning' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleAskForHint()}
                      disabled={isInterviewerTyping}
                      style={subtlePillBtnStyle}
                    >
                      <HelpCircle size={12} />
                      <span>Ask for a hint</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAdvanceToNextQuestion}
                      disabled={isInterviewerTyping}
                      style={subtlePillBtnStyle}
                    >
                      <SkipForward size={12} />
                      <span>Next question</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
