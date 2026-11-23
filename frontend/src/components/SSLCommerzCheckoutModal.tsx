import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { formatCurrencyCents } from '../features/experts/expertMatching';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

export interface SSLCommerzPaymentResult {
  paymentMethod: string;
  paymentReference: string;
}

interface Props {
  isOpen: boolean;
  amountCents: number;
  merchantTitle: string;
  itemSummary: string;
  customerName: string;
  customerEmail?: string;
  onCancel: () => void;
  onSuccess: (result: SSLCommerzPaymentResult) => Promise<void> | void;
}

type PaymentTab = 'cards' | 'mobile' | 'netbanking';

const MOBILE_WALLETS = [
  { id: 'bKash', name: 'bKash', color: '#E2136E', bg: '#FDF2F8', tag: 'Instant Pay' },
  { id: 'Nagad', name: 'Nagad', color: '#F26522', bg: '#FFF7ED', tag: '0% Fee' },
  { id: 'Rocket', name: 'Rocket', color: '#8C3494', bg: '#FAF5FF', tag: 'DBBL' },
  { id: 'Upay', name: 'Upay', color: '#0072BC', bg: '#EFF6FF', tag: 'UCB' },
] as const;

const NET_BANKS = [
  { id: 'Citytouch', name: 'Citytouch', sub: 'City Bank', color: '#B91C1C' },
  { id: 'BRAC Bank', name: 'BRAC Bank', sub: 'Astha / iBank', color: '#0369A1' },
  { id: 'DBBL', name: 'DBBL', sub: 'NexusPay / Net', color: '#6D28D9' },
  { id: 'EBL Skybanking', name: 'EBL Skybanking', sub: 'Eastern Bank', color: '#0F766E' },
  { id: 'Islami Bank', name: 'Islami Bank', sub: 'iBanking', color: '#15803D' },
  { id: 'MTB Smart', name: 'MTB Smart', sub: 'Mutual Trust', color: '#1D4ED8' },
] as const;

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function detectCardBrand(digits: string): string {
  if (digits.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'MasterCard';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return 'Card';
}

export const SSLCommerzCheckoutModal: React.FC<Props> = ({
  isOpen,
  amountCents,
  merchantTitle,
  itemSummary,
  customerName,
  customerEmail,
  onCancel,
  onSuccess,
}) => {
  const dialogRef = useAccessibleDialog(isOpen, onCancel);

  const [tranId] = useState(
    () => `SSL${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );
  const [activeTab, setActiveTab] = useState<PaymentTab>('cards');
  const [showSummary, setShowSummary] = useState(false);

  // Cards state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [saveCard, setSaveCard] = useState(false);

  // Mobile banking state
  const [selectedWallet, setSelectedWallet] = useState<(typeof MOBILE_WALLETS)[number]['id']>('bKash');
  const [mfsStep, setMfsStep] = useState<'number' | 'verify'>('number');
  const [mfsPhone, setMfsPhone] = useState('');
  const [mfsOtp, setMfsOtp] = useState('');
  const [mfsPin, setMfsPin] = useState('');

  // Net banking state
  const [selectedBank, setSelectedBank] = useState<(typeof NET_BANKS)[number]['id']>('Citytouch');
  const [bankUserId, setBankUserId] = useState('');

  // Processing state
  const [phase, setPhase] = useState<'checkout' | 'processing' | 'verified'>('checkout');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedAmount = formatCurrencyCents(amountCents);
  const selectedWalletMeta = MOBILE_WALLETS.find((w) => w.id === selectedWallet) || MOBILE_WALLETS[0];

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let paymentMethodLabel = 'SSLCOMMERZ';

    if (activeTab === 'cards') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13) {
        setError('Enter a valid card number (13–16 digits).');
        return;
      }
      if (cardExpiry.replace(/\D/g, '').length < 4) {
        setError('Enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        setError('Enter a valid 3 or 4 digit CVC/CVV.');
        return;
      }
      if (cardHolder.trim().length < 2) {
        setError('Enter the cardholder name.');
        return;
      }
      const brand = detectCardBrand(digits);
      paymentMethodLabel = `SSLCOMMERZ · ${brand} ****${digits.slice(-4)}`;
    } else if (activeTab === 'mobile') {
      const cleanPhone = mfsPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError(`Enter a valid ${selectedWallet} account mobile number.`);
        return;
      }
      if (mfsStep === 'number') {
        setMfsStep('verify');
        return;
      }
      if (mfsOtp.replace(/\D/g, '').length < 4) {
        setError('Enter the verification code (any 4–6 digits in sandbox).');
        return;
      }
      if (mfsPin.replace(/\D/g, '').length < 4) {
        setError(`Enter your ${selectedWallet} PIN.`);
        return;
      }
      paymentMethodLabel = `SSLCOMMERZ · ${selectedWallet} (${cleanPhone.slice(-4)})`;
    } else {
      if (bankUserId.trim().length < 3) {
        setError(`Enter your ${selectedBank} Internet Banking User ID / Reference.`);
        return;
      }
      paymentMethodLabel = `SSLCOMMERZ · ${selectedBank}`;
    }

    setPhase('processing');
    try {
      await new Promise((resolve) => setTimeout(resolve, 750));
      setPhase('verified');
      await new Promise((resolve) => setTimeout(resolve, 650));
      await onSuccess({
        paymentMethod: paymentMethodLabel,
        paymentReference: tranId,
      });
    } catch (err) {
      setPhase('checkout');
      setError(err instanceof Error ? err.message : 'Transaction could not be authorized.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1700,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '14px',
        fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      onClick={phase === 'checkout' ? onCancel : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="SSLCOMMERZ Payment Gateway"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '14px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45)',
          border: '1px solid #DCE3EC',
          overflow: 'hidden',
        }}
      >
        {/* SSLCOMMERZ Classic Blue Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E56A0 0%, #163172 100%)',
            color: '#FFFFFF',
            padding: '16px 18px 14px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#163172',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                CP
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {merchantTitle}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>
                  Tran ID: {tranId}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                }}
              >
                <Lock size={11} />
                <span>SSLCOMMERZ</span>
              </div>
              {phase === 'checkout' && (
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="Cancel payment"
                  style={{
                    background: 'rgba(255, 255, 255, 0.16)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Toggle Strip */}
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setShowSummary((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: '#E2E8F0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
            >
              <span>Order Summary</span>
              {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>
              {formattedAmount} <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85 }}>USD</span>
            </div>
          </div>

          {showSummary && (
            <div
              style={{
                marginTop: '8px',
                padding: '9px 11px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.25)',
                fontSize: '11.5px',
                display: 'grid',
                gap: '4px',
                color: '#F1F5F9',
              }}
            >
              <div><strong>Session:</strong> {itemSummary}</div>
              <div><strong>Customer:</strong> {customerName}{customerEmail ? ` (${customerEmail})` : ''}</div>
              <div><strong>Escrow:</strong> Released to expert only after session completion</div>
            </div>
          )}
        </div>

        {/* Body */}
        {phase !== 'checkout' ? (
          <div style={{ padding: '42px 24px', textAlign: 'center', display: 'grid', gap: '12px', placeItems: 'center' }}>
            {phase === 'processing' ? (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '4px solid #E2E8F0',
                    borderTopColor: '#1E56A0',
                    animation: 'spin 0.85s linear infinite',
                  }}
                />
                <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>
                  Processing Payment via SSLCOMMERZ…
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Authorizing {formattedAmount} ({tranId}). Do not close this window.
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#16A34A',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803D' }}>
                  Payment Verified (VALID)
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569' }}>
                  Transaction <strong>{tranId}</strong> confirmed. Redirecting back to Career Pilot…
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handlePaySubmit} style={{ display: 'grid', gap: '0' }}>
            {/* 3 Classic SSLCOMMERZ Payment Channel Tabs */}
            <div
              role="tablist"
              aria-label="SSLCOMMERZ Payment Methods"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                background: '#F1F5F9',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              {(
                [
                  { id: 'cards', label: 'CARDS', icon: CreditCard },
                  { id: 'mobile', label: 'MOBILE BANKING', icon: Smartphone },
                  { id: 'netbanking', label: 'NET BANKING', icon: Building2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setError(null);
                      setActiveTab(tab.id);
                    }}
                    style={{
                      padding: '11px 6px',
                      border: 'none',
                      borderBottom: active ? '2.5px solid #1E56A0' : '2.5px solid transparent',
                      background: active ? '#FFFFFF' : 'transparent',
                      color: active ? '#1E56A0' : '#475569',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '18px', display: 'grid', gap: '12px' }}>
              {error && (
                <div
                  role="alert"
                  style={{
                    padding: '9px 11px',
                    borderRadius: '8px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              {/* TAB 1: CARDS */}
              {activeTab === 'cards' && (
                <div style={{ display: 'grid', gap: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                      Accepted Cards
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {[
                        { label: 'VISA', bg: '#1A1F71' },
                        { label: 'MasterCard', bg: '#EB001B' },
                        { label: 'AMEX', bg: '#006FCF' },
                        { label: 'Nexus', bg: '#15803D' },
                      ].map((badge) => (
                        <span
                          key={badge.label}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: badge.bg,
                            color: '#FFFFFF',
                            fontSize: '9.5px',
                            fontWeight: 800,
                          }}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        MM / YY
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="12 / 29"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          background: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13.5px',
                          color: '#0F172A',
                          background: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      style={{ accentColor: '#1E56A0' }}
                    />
                    <span>Save card securely with SSLCOMMERZ for future bookings</span>
                  </label>
                </div>
              )}

              {/* TAB 2: MOBILE BANKING (bKash / Nagad / Rocket / Upay) */}
              {activeTab === 'mobile' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                    Select Mobile Wallet
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {MOBILE_WALLETS.map((wallet) => {
                      const active = selectedWallet === wallet.id;
                      return (
                        <button
                          key={wallet.id}
                          type="button"
                          onClick={() => {
                            setSelectedWallet(wallet.id);
                            setMfsStep('number');
                            setError(null);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: `2px solid ${active ? wallet.color : '#E2E8F0'}`,
                            background: active ? wallet.bg : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '7px',
                                background: wallet.color,
                                color: '#FFFFFF',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 900,
                                fontSize: '11px',
                              }}
                            >
                              {wallet.name.slice(0, 1)}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                              {wallet.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: wallet.color }}>
                            {wallet.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Branded MFS Gateway Prompt */}
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selectedWalletMeta.color}`,
                      background: selectedWalletMeta.bg,
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: selectedWalletMeta.color }}>
                        {selectedWalletMeta.name} Checkout Gateway
                      </span>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>
                        {formattedAmount}
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Your {selectedWalletMeta.name} Account Number
                      </label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={mfsPhone}
                        onChange={(e) => setMfsPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 14))}
                        disabled={mfsStep === 'verify'}
                        style={{
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: mfsStep === 'verify' ? '#F1F5F9' : '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {mfsStep === 'verify' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                            OTP Code
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="123456"
                            value={mfsOtp}
                            onChange={(e) => setMfsOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            style={{
                              width: '100%',
                              padding: '9px 11px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#0F172A',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                            {selectedWalletMeta.name} PIN
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            placeholder="••••"
                            value={mfsPin}
                            onChange={(e) => setMfsPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            style={{
                              width: '100%',
                              padding: '9px 11px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#0F172A',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: NET BANKING */}
              {activeTab === 'netbanking' && (
                <div style={{ display: 'grid', gap: '11px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                    Choose Your Internet Banking Partner
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {NET_BANKS.map((bank) => {
                      const active = selectedBank === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.id)}
                          style={{
                            padding: '9px 10px',
                            borderRadius: '9px',
                            border: `1.5px solid ${active ? bank.color : '#E2E8F0'}`,
                            background: active ? '#F8FAFC' : '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: bank.color }}>{bank.name}</div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>{bank.sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      {selectedBank} User ID / Account Reference
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Internet Banking User ID"
                      value={bankUserId}
                      onChange={(e) => setBankUserId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#0F172A',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Primary SSLCOMMERZ PAY Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    activeTab === 'mobile'
                      ? selectedWalletMeta.color
                      : 'linear-gradient(135deg, #1E56A0 0%, #163172 100%)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 6px 16px rgba(22, 49, 114, 0.25)',
                }}
              >
                {activeTab === 'mobile' && mfsStep === 'number'
                  ? `PROCEED WITH ${selectedWalletMeta.name.toUpperCase()} (${formattedAmount})`
                  : `PAY ${formattedAmount}`}
              </button>

              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px',
                }}
              >
                Cancel & Return to Career Pilot
              </button>
            </div>

            {/* Footer Trust Strip */}
            <div
              style={{
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              <ShieldCheck size={14} color="#16A34A" />
              <span>Powered by <strong>SSLCOMMERZ</strong> · 256-bit SSL &amp; PCI-DSS Secured</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
