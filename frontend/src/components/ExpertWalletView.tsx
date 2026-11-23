import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Clock,
  CreditCard,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import type {
  ExpertPayoutMethod,
  ExpertWallet,
  ExpertWithdrawal,
  WalletTransaction,
} from '../types';
import { expertRepository } from '../features/experts/expertRepository';
import { formatCurrencyCents } from '../features/experts/expertMatching';
import {
  BANK_OPTIONS,
  buildPayoutMethodPayload,
  getPayoutProviderMeta,
  inferPayoutProvider,
  PAYOUT_PROVIDERS,
  type MobileWalletAccountType,
  type PayoutProviderId,
} from '../features/experts/payoutProviders';
import { PayoutProviderLogo } from './PayoutProviderLogo';

interface Props {
  expertId: string;
  expertName?: string;
  wallet: ExpertWallet;
  transactions: WalletTransaction[];
  payoutMethods: ExpertPayoutMethod[];
  withdrawals: ExpertWithdrawal[];
  onRefreshWallet: () => Promise<void>;
  onToast: (msg: string) => void;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: '8px',
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface)',
  color: 'var(--md-text-primary)',
  fontSize: '12.5px',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: 'var(--md-text-secondary)',
  display: 'block',
  marginBottom: '4px',
};

export const ExpertWalletView: React.FC<Props> = ({
  expertId,
  expertName = '',
  wallet,
  transactions,
  payoutMethods,
  withdrawals,
  onRefreshWallet,
  onToast,
}) => {
  const defaultMethod = payoutMethods.find((m) => m.is_default) || payoutMethods[0];
  const [selectedMethodId, setSelectedMethodId] = useState(defaultMethod?.id || '');
  const [withdrawDollars, setWithdrawDollars] = useState(() =>
    wallet.available_balance_cents >= 1000 ? String(Math.floor(wallet.available_balance_cents / 100)) : '25'
  );
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Add payout method structured credential state
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [provider, setProvider] = useState<PayoutProviderId>('bkash');
  const [accountHolderName, setAccountHolderName] = useState(expertName);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileAccountType, setMobileAccountType] = useState<MobileWalletAccountType>('Personal');
  const [bankName, setBankName] = useState<string>(BANK_OPTIONS[0]);
  const [customBankName, setCustomBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('');
  const [walletEmail, setWalletEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [busyMethodId, setBusyMethodId] = useState<string | null>(null);

  const effectiveMethodId =
    selectedMethodId && payoutMethods.some((m) => m.id === selectedMethodId)
      ? selectedMethodId
      : defaultMethod?.id || '';

  const selectedProviderMeta = getPayoutProviderMeta(provider);
  const isMobileProvider =
    provider === 'bkash' || provider === 'nagad' || provider === 'rocket' || provider === 'upay';

  const resetCredentialInputs = () => {
    setAccountHolderName(expertName);
    setMobileNumber('');
    setMobileAccountType('Personal');
    setBankName(BANK_OPTIONS[0]);
    setCustomBankName('');
    setBankAccountNumber('');
    setBankBranch('');
    setRoutingOrSwift('');
    setWalletEmail('');
    setFormError(null);
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let payload;
    try {
      payload = buildPayoutMethodPayload({
        provider,
        accountHolderName,
        mobileNumber,
        mobileAccountType,
        bankName,
        customBankName,
        bankAccountNumber,
        bankBranch,
        routingOrSwift,
        walletEmail,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Check your account credentials.');
      return;
    }

    setIsSavingMethod(true);
    try {
      const created = await expertRepository.addPayoutMethod(
        expertId,
        payload.methodType,
        payload.accountLabel,
        payload.maskedDestination
      );
      setSelectedMethodId(created.id);
      resetCredentialInputs();
      setIsAddingMethod(false);
      await onRefreshWallet();
      onToast(`${selectedProviderMeta.label} payout credentials saved.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save payout method.');
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setBusyMethodId(methodId);
    try {
      await expertRepository.setDefaultPayoutMethod(expertId, methodId);
      setSelectedMethodId(methodId);
      await onRefreshWallet();
      onToast('Default payout method updated.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not update default payout method.');
    } finally {
      setBusyMethodId(null);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    setBusyMethodId(methodId);
    try {
      await expertRepository.deletePayoutMethod(methodId);
      await onRefreshWallet();
      onToast('Payout method removed.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not remove payout method.');
    } finally {
      setBusyMethodId(null);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveMethodId) {
      onToast('Add and select a payout method first.');
      return;
    }
    const amountCents = Math.round((Number.parseFloat(withdrawDollars) || 0) * 100);
    if (amountCents < 1000) {
      onToast('Minimum withdrawal amount is $10.00.');
      return;
    }
    if (amountCents > wallet.available_balance_cents) {
      onToast('Withdrawal amount exceeds your available balance.');
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await expertRepository.requestWithdrawal(effectiveMethodId, amountCents);
      await onRefreshWallet();
      onToast(
        `Withdrawal ${res.withdrawal.reference_code} (${formatCurrencyCents(amountCents)}) processed!`
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Withdrawal failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Wallet Balance KPIs */}
      <div className="wallet-kpi-grid">
        <div className="m3-surface-card" style={{ padding: '18px', borderLeft: '4px solid var(--md-success)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
            Available to Withdraw
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--md-success)', marginTop: '4px' }}>
            {formatCurrencyCents(wallet.available_balance_cents)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} /> Ready for instant payout
          </div>
        </div>

        <div className="m3-surface-card" style={{ padding: '18px', borderLeft: '4px solid var(--md-warning)' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
            Pending Escrow
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--md-text-primary)', marginTop: '4px' }}>
            {formatCurrencyCents(wallet.pending_escrow_cents)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> Released after sessions complete
          </div>
        </div>

        <div className="m3-surface-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
            Total Earned
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            {formatCurrencyCents(wallet.total_earned_cents)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px' }}>
            Withdrawn: {formatCurrencyCents(wallet.total_withdrawn_cents)}
          </div>
        </div>
      </div>

      {/* Withdraw Funds + Payout Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '16px', alignItems: 'start' }}>
        <form onSubmit={handleWithdraw} className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpRight size={18} color="var(--md-primary)" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Withdraw Funds</h2>
          </div>

          <div>
            <label style={LABEL_STYLE}>Payout Destination</label>
            {payoutMethods.length === 0 ? (
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'var(--md-text-secondary)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--md-surface-variant)',
                  border: '1px dashed var(--md-outline)',
                }}
              >
                Add your bKash, Nagad, Rocket, Bank Account, PayPal, or Payoneer credentials on the right to withdraw.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {payoutMethods.map((method) => {
                  const providerId = inferPayoutProvider(method);
                  const isSelected = method.id === effectiveMethodId;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethodId(method.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected
                          ? '1.5px solid var(--md-primary)'
                          : '1px solid var(--md-outline)',
                        background: isSelected
                          ? 'var(--md-primary-container)'
                          : 'var(--md-surface-variant)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <PayoutProviderLogo provider={providerId} size={32} />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--md-text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {method.account_label}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--md-text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {method.masked_destination}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '9999px',
                          border: isSelected ? 'none' : '1.5px solid var(--md-outline-variant)',
                          background: isSelected ? 'var(--md-primary)' : 'transparent',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="withdraw-dollars-input" style={LABEL_STYLE}>
              Amount ($ USD · Min $10.00)
            </label>
            <input
              id="withdraw-dollars-input"
              type="number"
              min={10}
              step="0.01"
              value={withdrawDollars}
              onChange={(e) => setWithdrawDollars(e.target.value)}
              style={{
                ...INPUT_STYLE,
                background: 'var(--md-surface-variant)',
                fontSize: '14px',
                fontWeight: 700,
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-m3-primary"
            disabled={isWithdrawing || payoutMethods.length === 0 || wallet.available_balance_cents < 1000}
            style={{ padding: '10px 16px' }}
          >
            {isWithdrawing ? 'Processing Payout...' : 'Withdraw to Account'}
          </button>
        </form>

        {/* Payout Methods Manager */}
        <div className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--md-primary)" />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Payout Methods</h2>
            </div>
            <button
              type="button"
              className="btn-m3-white"
              onClick={() => {
                setFormError(null);
                setIsAddingMethod((prev) => !prev);
              }}
              style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} /> {isAddingMethod ? 'Cancel' : 'Add Method'}
            </button>
          </div>

          {isAddingMethod && (
            <form
              onSubmit={handleAddMethod}
              style={{
                display: 'grid',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
              }}
            >
              <div>
                <span style={LABEL_STYLE}>Select Payout Provider</span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
                    gap: '6px',
                  }}
                >
                  {PAYOUT_PROVIDERS.map((item) => {
                    const active = provider === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setProvider(item.id);
                          setFormError(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '7px 8px',
                          borderRadius: '9px',
                          border: active
                            ? `1.5px solid ${item.brandColor}`
                            : '1px solid var(--md-outline)',
                          background: active ? item.surfaceTint : 'var(--md-surface)',
                          color: 'var(--md-text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <PayoutProviderLogo provider={item.id} size={24} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, lineHeight: 1.15 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--md-text-muted)', lineHeight: 1.15 }}>
                            {item.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--md-error-bg)',
                    color: 'var(--md-error)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="payout-holder-name" style={LABEL_STYLE}>
                  Account Holder Full Name *
                </label>
                <input
                  id="payout-holder-name"
                  type="text"
                  placeholder="e.g. Md. Rabbi Hasan"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                  style={INPUT_STYLE}
                />
              </div>

              {isMobileProvider && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <div>
                    <label htmlFor="payout-mobile-number" style={LABEL_STYLE}>
                      {selectedProviderMeta.label} Account Number *
                    </label>
                    <input
                      id="payout-mobile-number"
                      type="tel"
                      placeholder="e.g. 01712345678"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label htmlFor="payout-mobile-type" style={LABEL_STYLE}>
                      Wallet Type
                    </label>
                    <select
                      id="payout-mobile-type"
                      value={mobileAccountType}
                      onChange={(e) => setMobileAccountType(e.target.value as MobileWalletAccountType)}
                      style={INPUT_STYLE}
                    >
                      <option value="Personal">Personal</option>
                      <option value="Merchant">Merchant</option>
                      <option value="Agent">Agent</option>
                    </select>
                  </div>
                </div>
              )}

              {provider === 'bank_transfer' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                    <div>
                      <label htmlFor="payout-bank-select" style={LABEL_STYLE}>
                        Bank Name *
                      </label>
                      <select
                        id="payout-bank-select"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={INPUT_STYLE}
                      >
                        {BANK_OPTIONS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="payout-bank-account" style={LABEL_STYLE}>
                        Bank Account Number *
                      </label>
                      <input
                        id="payout-bank-account"
                        type="text"
                        placeholder="e.g. 15012044821001"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        required
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>

                  {bankName === 'Other Bank' && (
                    <div>
                      <label htmlFor="payout-custom-bank" style={LABEL_STYLE}>
                        Custom Bank Name *
                      </label>
                      <input
                        id="payout-custom-bank"
                        type="text"
                        placeholder="Enter bank name"
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        required
                        style={INPUT_STYLE}
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <div>
                      <label htmlFor="payout-bank-branch" style={LABEL_STYLE}>
                        Branch Name
                      </label>
                      <input
                        id="payout-bank-branch"
                        type="text"
                        placeholder="e.g. Gulshan Avenue"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label htmlFor="payout-bank-routing" style={LABEL_STYLE}>
                        Routing / SWIFT Code
                      </label>
                      <input
                        id="payout-bank-routing"
                        type="text"
                        placeholder="e.g. 060261726"
                        value={routingOrSwift}
                        onChange={(e) => setRoutingOrSwift(e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                </>
              )}

              {(provider === 'paypal' || provider === 'payoneer') && (
                <div>
                  <label htmlFor="payout-wallet-email" style={LABEL_STYLE}>
                    {selectedProviderMeta.label} Account Email *
                  </label>
                  <input
                    id="payout-wallet-email"
                    type="email"
                    placeholder={`e.g. name@example.com`}
                    value={walletEmail}
                    onChange={(e) => setWalletEmail(e.target.value)}
                    required
                    style={INPUT_STYLE}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn-m3-primary"
                disabled={isSavingMethod}
                style={{ padding: '9px 12px', fontSize: '12.5px' }}
              >
                {isSavingMethod ? 'Saving Credentials...' : `Save ${selectedProviderMeta.label} Account`}
              </button>
            </form>
          )}

          {payoutMethods.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--md-text-muted)' }}>
              No payout methods saved yet. Add bKash, Nagad, Rocket, Bank Account, PayPal, or Payoneer.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {payoutMethods.map((method) => {
                const providerId = inferPayoutProvider(method);
                const meta = getPayoutProviderMeta(providerId);
                const isBusy = busyMethodId === method.id;
                return (
                  <div
                    key={method.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: method.is_default
                        ? `1px solid ${meta.brandColor}`
                        : '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <PayoutProviderLogo provider={providerId} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                            {method.account_label}
                          </span>
                          {method.is_default && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: 'var(--md-success)',
                                background: 'var(--md-success-bg)',
                                padding: '1px 6px',
                                borderRadius: '9999px',
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', marginTop: '1px' }}>
                          {method.masked_destination}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {!method.is_default && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleSetDefault(method.id)}
                          className="btn-m3-white"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Delete payout method"
                        disabled={isBusy}
                        onClick={() => void handleDeleteMethod(method.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-error)', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ledger & Withdrawal History */}
      <section className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={18} color="var(--md-primary)" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Wallet Ledger & Withdrawals</h2>
        </div>

        {withdrawals.length > 0 && (
          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
              Recent Withdrawals
            </div>
            {withdrawals.map((wd) => {
              const wdProvider = inferPayoutProvider(wd.payout_summary);
              return (
                <div
                  key={wd.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--md-surface-variant)',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <PayoutProviderLogo provider={wdProvider} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <strong>{wd.reference_code}</strong> · {wd.payout_summary}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--md-primary)', flexShrink: 0 }}>
                    -{formatCurrencyCents(wd.amount_cents)} ({wd.status})
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transactions.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--md-text-muted)' }}>
            No wallet transactions recorded yet. Bookings and completed sessions will appear here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {transactions.map((tx) => {
              const isCredit = tx.tx_type === 'session_release' || tx.tx_type === 'escrow_hold';
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-outline)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowDownToLine size={15} color={isCredit ? 'var(--md-success)' : 'var(--md-text-muted)'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{tx.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                        {tx.tx_type.replace(/_/g, ' ')} · {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: tx.tx_type === 'session_release' ? 'var(--md-success)' : 'var(--md-text-primary)',
                      }}
                    >
                      {tx.amount_cents >= 0 ? `+${formatCurrencyCents(tx.amount_cents)}` : formatCurrencyCents(tx.amount_cents)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                      Avail: {formatCurrencyCents(tx.available_balance_after_cents)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
