import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FastForward,
  Mic,
  MicOff,
  Pause,
  Send,
  Sparkles,
} from 'lucide-react';
import type { AICoachMessage } from '../../types';

interface SpeechResultLike { 0?: { transcript?: string }; }
interface SpeechEventLike extends Event { results: ArrayLike<SpeechResultLike>; }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
}

interface Props {
  messages: AICoachMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  onApplyProposal: (action: string, days?: number) => void;
  onBack?: () => void;
  isDesktopEmbedded?: boolean;
}

const STARTER_PROMPTS = [
  {
    title: 'Weekly pace check',
    prompt: 'Analyze my current weekly pace, bottlenecks, and top priority next.',
  },
  {
    title: 'Rebalance study plan',
    prompt: 'Rebalance my upcoming study workload to stay realistic with my daily schedule.',
  },
  {
    title: 'Stage checkpoint prep',
    prompt: 'Summarize the core concepts and common pitfalls I should verify for my current stage.',
  },
] as const;

export const AICoachView: React.FC<Props> = ({
  messages,
  onSendMessage,
  isSending,
  onApplyProposal,
  onBack,
  isDesktopEmbedded = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionConstructor = getSpeechRecognitionConstructor();

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!speechRecognitionConstructor) return;

    const recognition = new speechRecognitionConstructor();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript?.trim() || '')
        .filter(Boolean)
        .join(' ');
      if (transcript) {
        setInputText((current) => `${current.trim()}${current.trim() ? ' ' : ''}${transcript}`);
        setVoiceMessage('Voice note added. Review and send.');
      }
    };
    recognition.onerror = (event) => {
      setVoiceMessage(
        event.error === 'not-allowed'
          ? 'Microphone access denied. Type your message instead.'
          : 'Voice input is unavailable right now.'
      );
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setVoiceMessage('Listening… speak naturally.');
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceMessage('Could not start voice input.');
    }
  };

  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? inputText).trim();
    if (!content || isSending) return;
    if (!overrideText) setInputText('');
    await onSendMessage(content);
  };

  const handlePlanShift = (action: 'behind' | 'early' | 'pause', label: string) => {
    onApplyProposal(action);
    setActionFeedback(`Applied: ${label}`);
    window.setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard restricted
    }
  };

  return (
    <div className="ac-shell">
      {/* Compact Header */}
      <header className="m3-surface-card ac-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {!isDesktopEmbedded && onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Roadmap"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'var(--md-surface-subtle)',
                border: '1px solid var(--md-outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--md-text-primary)',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--md-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={17} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--md-text-primary)', letterSpacing: '-0.02em' }}>
                Career Coach
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isSending ? 'var(--md-primary)' : '#059669',
                  background: isSending ? 'var(--md-primary-container)' : 'rgba(5, 150, 105, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSending ? 'var(--md-primary)' : '#059669',
                  }}
                />
                {isSending ? 'Responding' : 'Ready'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              Pacing guidance &amp; roadmap adjustments
            </span>
          </div>
        </div>

        {/* Grouped Schedule Actions in Header */}
        <div
          role="group"
          aria-label="Quick schedule adjustments"
          style={{
            height: '34px',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            borderRadius: '9px',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            disabled={isSending}
            onClick={() => handlePlanShift('behind', '+3d Buffer')}
            className="ac-shift-btn"
            title="Add 3-day buffer to upcoming deadlines"
          >
            <Clock size={12} /> +3d
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handlePlanShift('early', 'Move Earlier')}
            className="ac-shift-btn"
            title="Advance schedule early"
          >
            <FastForward size={12} /> Advance
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handlePlanShift('pause', 'Pause 7d')}
            className="ac-shift-btn last"
            title="Pause schedule for 7 days"
          >
            <Pause size={12} /> Pause
          </button>
        </div>
      </header>

      {actionFeedback && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: '9px',
            background: 'var(--md-primary-container)',
            border: '1px solid var(--md-primary)',
            color: 'var(--md-primary)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Check size={13} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main 2-Pane Coach Workspace */}
      <div className="ac-workspace">
        {/* Conversation Column */}
        <section className="m3-surface-card ac-chat-panel" aria-label="Coach conversation">
          <div className="ac-messages-scroll">
            {messages.length === 0 ? (
              <div className="ac-empty-state">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--md-primary-container)',
                    color: 'var(--md-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                  How can we move your roadmap forward?
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: 'var(--md-text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
                  Ask about a difficult topic, ask for a workload rebalance, or shift your deadlines cleanly.
                </p>
                <div className="ac-starter-grid">
                  {STARTER_PROMPTS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleSend(item.prompt)}
                      className="ac-starter-card"
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                        {item.title}
                      </span>
                      <ArrowUpRight size={14} style={{ color: 'var(--md-primary)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAi ? 'flex-start' : 'flex-end',
                      gap: '6px',
                    }}
                  >
                    {isAi ? (
                      <div className="ac-msg-ai-row">
                        <div className="ac-ai-badge" aria-hidden="true">
                          <Sparkles size={13} />
                        </div>
                        <div className="ac-msg-ai-body">
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                          <div className="ac-msg-meta-row">
                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.id, msg.text)}
                              className="ac-copy-btn"
                              aria-label="Copy response"
                            >
                              {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ac-msg-user-pill">{msg.text}</div>
                    )}

                    {/* Structured Proposal Card */}
                    {msg.proposal && (
                      <div className="ac-proposal-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                          <Sparkles size={14} color="var(--md-primary)" />
                          <strong style={{ fontSize: '13px', color: 'var(--md-text-primary)' }}>
                            {msg.proposal.title}
                          </strong>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                          {msg.proposal.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => onApplyProposal(msg.proposal!.action, msg.proposal!.days)}
                          className="btn-m3-primary"
                          style={{ padding: '7px 14px', fontSize: '12px' }}
                        >
                          <CheckCircle2 size={13} />
                          Apply Plan Shift
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="ac-msg-ai-row" role="status">
                <div className="ac-ai-badge" aria-hidden="true">
                  <Sparkles size={13} />
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', paddingTop: '5px' }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {voiceMessage && (
            <p role="status" style={{ margin: '0 16px 8px', color: 'var(--md-text-secondary)', fontSize: '11.5px' }}>
              {voiceMessage}
            </p>
          )}

          {/* Composer Dock */}
          <div className="ac-composer-wrap">
            <div className="ac-composer-box">
              <input
                type="text"
                placeholder="Ask about a topic, study pacing, or next priorities…"
                aria-label="Message your coach"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={isSending}
                className="ac-composer-input"
              />

              {speechRecognitionConstructor && (
                <button
                  type="button"
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  aria-pressed={isListening}
                  title="Voice input"
                  onClick={toggleVoiceInput}
                  disabled={isSending}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: isListening ? 'var(--md-error-bg)' : 'var(--md-surface-subtle)',
                    border: '1px solid var(--md-outline-variant)',
                    color: isListening ? 'var(--md-error)' : 'var(--md-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              )}

              <button
                type="button"
                aria-label="Send message"
                onClick={() => void handleSend()}
                disabled={!inputText.trim() || isSending}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: inputText.trim() ? 'var(--md-primary)' : 'var(--md-surface-muted)',
                  color: inputText.trim() ? '#ffffff' : 'var(--md-text-muted)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputText.trim() ? 'pointer' : 'default',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Right Side Rail: Quick Prompts */}
        <aside className="m3-surface-card ac-rail" aria-label="Coach shortcuts">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--md-primary)' }}>
            Quick Prompts
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Summarize my week', prompt: 'Give me a concise summary of my weekly progress and what to focus on next.' },
              { label: 'Rebalance workload', prompt: 'Help me rebalance my upcoming tasks for this week.' },
              { label: 'Explain current blocker', prompt: 'Walk me through a structured approach for breaking through my current study blocker.' },
              { label: 'Prep for mock interview', prompt: 'What high-leverage concepts from my roadmap come up most often in interviews?' },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={isSending}
                onClick={() => void handleSend(q.prompt)}
                className="ac-rail-prompt-btn"
              >
                <span>{q.label}</span>
                <ArrowUpRight size={13} style={{ color: 'var(--md-text-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--md-outline-variant)', paddingTop: '12px', fontSize: '11.5px', color: 'var(--md-text-secondary)', lineHeight: 1.5 }}>
            Conversation history is saved automatically across sessions.
          </div>
        </aside>
      </div>

      <style>{coachStyles}</style>
    </div>
  );
};

const coachStyles = `
.ac-shell {
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 32px;
}

.ac-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.ac-shift-btn {
  height: 100%;
  padding: 0 10px;
  border: none;
  border-right: 1px solid var(--md-outline-variant);
  background: transparent;
  color: var(--md-text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.ac-shift-btn.last {
  border-right: none;
}
.ac-shift-btn:hover:not(:disabled) {
  background: var(--md-primary-container);
  color: var(--md-primary);
}
.ac-shift-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ac-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
@media (min-width: 900px) {
  .ac-workspace {
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 20px;
  }
}

.ac-chat-panel {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 460px;
  max-height: 68vh;
}

.ac-messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ac-empty-state {
  margin: auto 0;
  padding: 24px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ac-starter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 620px;
}

.ac-starter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-subtle);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ac-starter-card:hover:not(:disabled) {
  border-color: var(--md-primary);
  background: var(--md-primary-container);
}

.ac-msg-ai-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 90%;
}

.ac-ai-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--md-primary-container);
  color: var(--md-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.ac-msg-ai-body {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--md-text-primary);
  background: var(--md-surface-subtle);
  border: 1px solid var(--md-outline-variant);
  border-radius: 12px;
  padding: 12px 15px;
}

.ac-msg-meta-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.ac-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--md-text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.ac-copy-btn:hover {
  color: var(--md-primary);
  background: var(--md-surface);
  border-color: var(--md-outline-variant);
}

.ac-msg-user-pill {
  max-width: 82%;
  padding: 10px 15px;
  border-radius: 14px;
  background: var(--md-primary);
  color: #ffffff;
  font-size: 13.5px;
  line-height: 1.5;
}

.ac-proposal-card {
  margin-left: 38px;
  max-width: 82%;
  padding: 13px 15px;
  border-radius: 10px;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-left: 3px solid var(--md-primary);
}

.ac-composer-wrap {
  padding: 12px 16px;
  border-top: 1px solid var(--md-outline-variant);
  background: var(--md-surface);
}

.ac-composer-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border-radius: 12px;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-subtle);
}

.ac-composer-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13.5px;
  color: var(--md-text-primary);
  min-height: 32px;
}

.ac-rail {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ac-rail-prompt-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-subtle);
  color: var(--md-text-primary);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ac-rail-prompt-btn:hover:not(:disabled) {
  border-color: var(--md-primary);
  background: var(--md-primary-container);
  color: var(--md-primary);
}
`;
