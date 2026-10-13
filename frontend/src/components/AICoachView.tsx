import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Send, Mic, CheckCircle2 } from 'lucide-react';
import type { AICoachMessage } from '../types';

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
    { label: 'Create New plan', action: 'new_plan' },
    { label: "I'm behind ($0 cost)", action: 'behind' },
    { label: 'Finished early ($0 cost)', action: 'early' },
    { label: 'Pause a week ($0 cost)', action: 'pause' },
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>AI Assistant</h2>

          <div style={{ width: '40px' }} />
        </div>
      )}

      {/* 2. Glowing AI Orb Hero Card (Matching Image 1 Right Screen) */}
      <div className="ai-orb-container">
        {/* Avatars top-left */}
        <div style={{ position: 'absolute', top: '14px', left: '16px', display: 'flex' }}>
          {[
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50',
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50',
          ].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="coach"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.7)',
                marginLeft: i > 0 ? '-8px' : '0',
                objectFit: 'cover',
              }}
            />
          ))}
        </div>

        {/* Pulsing AI Voice Wave Orb */}
        <div className="ai-pulse-orb" />

        <div
          style={{
            marginTop: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            padding: '4px 16px',
            borderRadius: '9999px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          StudyZen Neural Engine
        </div>

        {/* Mic action button */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
          <button
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              color: '#6366f1',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#818cf8" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-primary-light)' }}>
            {promptsLeft} Prompts left this week
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)' }}>
          Low-AI Gateway on Supabase
        </span>
      </div>

      {/* 4. Chat Messages Scroll Area */}
      <div style={{ flex: 1, minHeight: '220px', overflowY: 'auto', marginBottom: '14px', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div
              className={`ai-chat-bubble ${msg.sender}`}
              style={{
                background: msg.sender === 'user' ? 'var(--md-primary)' : 'var(--md-surface)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--md-text-primary)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--md-outline)',
              }}
            >
              <p style={{ margin: 0 }}>{msg.text}</p>
              <span
                style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  display: 'block',
                  textAlign: 'right',
                  marginTop: '4px',
                }}
              >
                {msg.timestamp}
              </span>
            </div>

            {/* Structured Proposal Confirmation Card (Docx Section 6 & 8) */}
            {msg.proposal && (
              <div
                style={{
                  background: 'var(--md-surface-variant)',
                  border: '1.5px solid var(--md-outline)',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '14px',
                  maxWidth: '85%',
                  alignSelf: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CheckCircle2 size={16} color="#6366f1" />
                  <strong style={{ fontSize: '13px', color: 'var(--md-text-primary)' }}>{msg.proposal.title}</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
                  {msg.proposal.description}
                </p>
                <button
                  className="btn-m3-primary"
                  style={{ width: '100%', padding: '9px 16px', fontSize: '12.5px' }}
                  onClick={() => onApplyProposal(msg.proposal!.action, msg.proposal!.days)}
                >
                  Confirm & Apply to Roadmap ($0)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Quick Action Chips (Zero-cost buttons first!) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
        {quickActionChips.map((chip) => (
          <button
            key={chip.action}
            className="ai-action-chip"
            onClick={() => onSendMessage(chip.label)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 6. Text Input Field */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--md-surface)',
          border: '1.5px solid var(--md-outline)',
          borderRadius: '9999px',
          padding: '6px 8px 6px 18px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <input
          type="text"
          placeholder="Ask me anything..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            fontSize: '13px',
            fontFamily: 'var(--font-main)',
            background: 'transparent',
            color: 'var(--md-text-primary)',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--md-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
