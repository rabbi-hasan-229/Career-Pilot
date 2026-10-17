import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Send, Mic, CheckCircle2 } from 'lucide-react';
import type { AICoachMessage } from '../../types';

interface Props {
  messages: AICoachMessage[];
  promptsLeft: number;
  onSendMessage: (text: string) => void;
  onApplyProposal: (action: string, days?: number) => void;
  onBack?: () => void;
  isDesktopEmbedded?: boolean;
}

export const AICoachView: React.FC<Props> = ({
  messages,
  promptsLeft,
  onSendMessage,
  onApplyProposal,
  onBack,
  isDesktopEmbedded = false,
}) => {
  const [inputText, setInputText] = useState('');

  const quickActionChips = [
    { label: 'Week Summary', action: 'summary' },
    { label: 'Rebalance Roadmap', action: 'new_plan' },
    { label: "I'm behind (+3d)", action: 'behind' },
    { label: 'Finished early', action: 'early' },
    { label: 'Pause a week', action: 'pause' },
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header (Mobile mode) */}
      {!isDesktopEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-primary)',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>AI Career Coach</h2>

          <div style={{ width: '40px' }} />
        </div>
      )}

      {/* 2. Glowing AI Orb Hero Card */}
      <div className="ai-orb-container" style={{ background: 'linear-gradient(135deg, #8EA95B 0%, #6E8841 100%)' }}>
        <div className="ai-pulse-orb" />

        <div
          style={{
            marginTop: '12px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            padding: '4px 16px',
            borderRadius: '9999px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          Career Pilot AI Engine
        </div>

        <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
          <button
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              color: '#8EA95B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              cursor: 'pointer',
            }}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* 3. Low-AI Quota Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
          Powered by Supabase AI Gateway (metered & cached)
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#8EA95B',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sparkles size={12} />
          {promptsLeft} calls left
        </span>
      </div>

      {/* 4. Quick Action Chips (Zero AI Cost direct triggers) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '14px',
          scrollbarWidth: 'none',
        }}
      >
        {quickActionChips.map((chip, idx) => (
          <button
            key={idx}
            className="ai-action-chip"
            onClick={() => {
              if (['behind', 'early', 'pause'].includes(chip.action)) {
                onApplyProposal(chip.action);
              } else {
                onSendMessage(`I need a quick ${chip.label.toLowerCase()} for my roadmap.`);
              }
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 5. Messages Scrollable Log */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '4px',
          marginBottom: '16px',
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={`ai-chat-bubble ${msg.sender === 'ai' ? 'bot' : 'user'}`}>
              {msg.text}
            </div>

            {/* Structured Proposal Card */}
            {msg.proposal && (
              <div
                style={{
                  background: 'var(--md-surface)',
                  border: '1.5px solid #8EA95B',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                  maxWidth: '85%',
                  boxShadow: '0 4px 14px rgba(142, 169, 91, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="#8EA95B" />
                  <strong style={{ fontSize: '13px', color: 'var(--md-text-primary)' }}>
                    {msg.proposal.title}
                  </strong>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', margin: '0 0 10px 0' }}>
                  {msg.proposal.description}
                </p>
                <button
                  onClick={() => onApplyProposal(msg.proposal!.action, msg.proposal!.days)}
                  style={{
                    background: '#8EA95B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  Apply Proposed Roadmap Shift
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 6. Text Input Field */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline)',
          borderRadius: '9999px',
          padding: '6px 8px 6px 18px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <input
          type="text"
          placeholder="Ask AI Coach to optimize schedule or clarify concepts..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: 'var(--md-text-primary)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: inputText.trim() ? '#8EA95B' : 'var(--md-surface-variant)',
            color: inputText.trim() ? '#ffffff' : 'var(--md-text-muted)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
