import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Star,
  Sun,
  User,
  Wallet,
} from 'lucide-react';
import type {
  ExpertBooking,
  ExpertDashboardTab,
  ExpertPayoutMethod,
  ExpertProfile,
  ExpertWallet,
  ExpertWithdrawal,
  Profile,
  WalletTransaction,
} from '../types';
import type { ThemeMode } from '../lib/theme';
import { expertRepository } from '../features/experts/expertRepository';
import { formatCurrencyCents, formatHourlyRate } from '../features/experts/expertMatching';
import { ExpertSessionsView } from './ExpertSessionsView';
import { ExpertAvailabilityView } from './ExpertAvailabilityView';
import { ExpertWalletView } from './ExpertWalletView';
import { ExpertProfileEditorView } from './ExpertProfileEditorView';
import { ExpertResourcesView } from './ExpertResourcesView';
import { ExpertSessionMessagesView } from './ExpertSessionMessagesView';
import { ExpertIntroCard } from './ExpertIntroCard';
import { MobileNavDrawer, MobileSectionStrip } from './MobileNavDrawer';
import { createRealtimeChannelName, syncSupabaseRealtimeAuth } from '../features/experts/sessionChatSync';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Props {
  profile: Profile;
  expertProfile: ExpertProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onExpertProfileUpdated: (updated: ExpertProfile) => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
  onToast: (msg: string) => void;
}

export const ExpertDashboardShell: React.FC<Props> = ({
  profile,
  expertProfile,
  theme,
  onToggleTheme,
  onExpertProfileUpdated,
  onSignOut,
  onDeleteAccount,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<ExpertDashboardTab>('overview');
  const [bookings, setBookings] = useState<ExpertBooking[]>([]);
  const [wallet, setWallet] = useState<ExpertWallet>({
    expert_id: expertProfile.user_id,
    pending_escrow_cents: 0,
    available_balance_cents: 0,
    total_earned_cents: 0,
    total_withdrawn_cents: 0,
    currency: 'USD',
    updated_at: '',
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<ExpertPayoutMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<ExpertWithdrawal[]>([]);
  const [isSchemaMigrated, setIsSchemaMigrated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [migrated, bookingRows, ledger] = await Promise.all([
        expertRepository.isExpertMarketplaceMigrated(),
        expertRepository.loadExpertBookings(expertProfile.user_id),
        expertRepository.loadExpertWalletAndLedger(expertProfile.user_id),
      ]);
      setIsSchemaMigrated(migrated);
      setBookings(bookingRows);
      setWallet(ledger.wallet);
      setTransactions(ledger.transactions);
      setPayoutMethods(ledger.payoutMethods);
      setWithdrawals(ledger.withdrawals);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not load expert dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [expertProfile.user_id, onToast]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      expertRepository.isExpertMarketplaceMigrated(),
      expertRepository.loadExpertBookings(expertProfile.user_id),
      expertRepository.loadExpertWalletAndLedger(expertProfile.user_id),
    ])
      .then(([migrated, bookingRows, ledger]) => {
        if (!active) return;
        setIsSchemaMigrated(migrated);
        setBookings(bookingRows);
        setWallet(ledger.wallet);
        setTransactions(ledger.transactions);
        setPayoutMethods(ledger.payoutMethods);
        setWithdrawals(ledger.withdrawals);
      })
      .catch((err) => {
        if (active) onToast(err instanceof Error ? err.message : 'Could not load expert dashboard data.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [expertProfile.user_id, onToast]);

  // Realtime sync for new bookings & escrow updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      await syncSupabaseRealtimeAuth();
      if (!active) return;

      channel = supabase
        .channel(createRealtimeChannelName('expert_dashboard', expertProfile.user_id))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expert_bookings',
            filter: `expert_id=eq.${expertProfile.user_id}`,
          },
          () => {
            void loadDashboardData();
          }
        )
        .subscribe((status) => {
          if (active && status === 'SUBSCRIBED') {
            void loadDashboardData();
          }
        });
    };

    void connect();

    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void loadDashboardData();
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      active = false;
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [expertProfile.user_id, loadDashboardData]);

  const navItems: Array<{ id: ExpertDashboardTab; label: string; shortLabel?: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'messages', label: 'Session Chat', shortLabel: 'Chat', icon: MessageSquare },
    { id: 'availability', label: 'Rates & Hours', icon: Clock },
    { id: 'resources', label: 'Files & Resources', icon: FolderOpen },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Portfolio & CV', icon: User },
  ];

  const pendingCount = bookings.filter((b) => b.status === 'pending_confirmation').length;
  const upcomingCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="app-root-container">
      <div className="app-desktop-shell">
        <a className="skip-to-main" href="#expert-main-content">
          Skip to main content
        </a>

        {/* Left Desktop Sidebar */}
        <aside className="desktop-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'var(--md-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Compass size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
                  Career Pilot
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)' }}>
                  Expert Studio
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="var(--md-text-secondary)" />}
            </button>
          </div>

          <nav aria-label="Expert dashboard navigation" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--md-primary-container)' : 'transparent',
                    color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? 'var(--md-primary)' : 'var(--md-text-muted)'} />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'sessions' && pendingCount > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        background: 'var(--md-primary)',
                        color: '#FFFFFF',
                        padding: '1px 7px',
                        borderRadius: '9999px',
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Expert Footer & Sign Out */}
          <div
            style={{
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {expertProfile.display_name}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--md-text-muted)' }}>
                {formatHourlyRate(expertProfile.hourly_rate_cents)} · {expertProfile.status}
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--md-text-secondary)',
                padding: '4px',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="desktop-main-area" id="expert-main-content" tabIndex={-1}>
          <header className="app-navbar">
            <div className="app-navbar-brand">
              <button
                type="button"
                className="mobile-menu-trigger-btn"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open expert dashboard menu"
                title="All Expert Pages"
              >
                <Menu size={18} />
              </button>
              <div className="app-navbar-avatar">
                <img
                  src={expertProfile.avatar_url || profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(expertProfile.display_name)}`}
                  alt={expertProfile.display_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)' }}>
                    Expert Dashboard
                  </span>
                  {expertProfile.verification_tier === 'verified' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--md-success)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  )}
                </div>
                <h1 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
                  {expertProfile.display_name}
                </h1>
              </div>
            </div>

            <div className="app-navbar-actions">
              <button
                type="button"
                className="app-navbar-icon-btn"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                className="app-navbar-icon-btn"
                onClick={onSignOut}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          <MobileSectionStrip
            items={navItems.map((item) => ({
              id: item.id,
              label: item.label,
              icon: item.icon,
              badge: item.id === 'sessions' ? pendingCount : undefined,
            }))}
            activeId={activeTab}
            onSelect={(id) => setActiveTab(id as ExpertDashboardTab)}
            ariaLabel="Expert dashboard sections"
          />

          <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '16px 20px 88px', display: 'grid', gap: '16px' }}>
            {!isSchemaMigrated && (
              <div
                role="status"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--md-warning-bg)',
                  border: '1px solid var(--md-warning)',
                  color: 'var(--md-text-primary)',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                }}
              >
                <strong>Local Preview Active (Supabase migration pending):</strong> Your expert credentials are saved locally. Apply{' '}
                <code>supabase/migrations/20261122000000_expert_marketplace_wallet.sql</code> to your Supabase project to publish your profile to learners and receive bookings &amp; wallet payouts.
              </div>
            )}
            {activeTab === 'overview' && (
              <>
                <ExpertIntroCard
                  expertProfile={expertProfile}
                  fallbackAvatarUrl={profile.avatar_url}
                  onEditProfile={() => setActiveTab('profile')}
                />

                <div className="wallet-kpi-grid">
                  <div className="m3-surface-card" style={{ padding: '18px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                      Available Wallet Balance
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--md-success)', marginTop: '4px' }}>
                      {formatCurrencyCents(wallet.available_balance_cents)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px' }}>
                      Pending Escrow: {formatCurrencyCents(wallet.pending_escrow_cents)}
                    </div>
                  </div>

                  <div className="m3-surface-card" style={{ padding: '18px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                      Sessions Queue
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                      {pendingCount + upcomingCount} Active
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px' }}>
                      {pendingCount} awaiting confirmation · {upcomingCount} upcoming
                    </div>
                  </div>

                  <div className="m3-surface-card" style={{ padding: '18px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>
                      Rating & Hourly Wage
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={18} fill="#F59E0B" color="#F59E0B" />
                      <span>{expertProfile.rating_avg ? expertProfile.rating_avg.toFixed(1) : 'New'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', marginTop: '4px' }}>
                      {formatHourlyRate(expertProfile.hourly_rate_cents)} · {expertProfile.completed_sessions_count} sessions completed
                    </div>
                  </div>
                </div>

                <section className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={17} color="var(--md-primary)" /> Pending & Upcoming Sessions
                    </h2>
                    <button type="button" className="btn-m3-white" onClick={() => setActiveTab('sessions')}>
                      Manage All Sessions
                    </button>
                  </div>

                  {isLoading ? (
                    <div style={{ fontSize: '13px', color: 'var(--md-text-muted)' }}>Loading sessions...</div>
                  ) : (
                    <ExpertSessionsView
                      expertProfile={expertProfile}
                      bookings={bookings.filter((b) => b.status === 'pending_confirmation' || b.status === 'confirmed')}
                      onBookingUpdated={() => void loadDashboardData()}
                      onToast={onToast}
                    />
                  )}
                </section>
              </>
            )}

            {activeTab === 'sessions' && (
              <ExpertSessionsView
                expertProfile={expertProfile}
                bookings={bookings}
                onBookingUpdated={() => void loadDashboardData()}
                onToast={onToast}
              />
            )}

            {activeTab === 'messages' && (
              <ExpertSessionMessagesView
                expertProfile={expertProfile}
                bookings={bookings}
                onGoToSessions={() => setActiveTab('sessions')}
                onToast={onToast}
              />
            )}

            {activeTab === 'availability' && (
              <ExpertAvailabilityView
                expertProfile={expertProfile}
                onProfileUpdated={onExpertProfileUpdated}
                onToast={onToast}
              />
            )}

            {activeTab === 'resources' && (
              <ExpertResourcesView
                expertId={expertProfile.user_id}
                onToast={onToast}
              />
            )}

            {activeTab === 'wallet' && (
              <ExpertWalletView
                expertId={expertProfile.user_id}
                expertName={expertProfile.display_name}
                wallet={wallet}
                transactions={transactions}
                payoutMethods={payoutMethods}
                withdrawals={withdrawals}
                onRefreshWallet={loadDashboardData}
                onToast={onToast}
              />
            )}

            {activeTab === 'profile' && (
              <ExpertProfileEditorView
                expertProfile={expertProfile}
                onProfileUpdated={onExpertProfileUpdated}
                onSignOut={onSignOut}
                onDeleteAccount={onDeleteAccount}
                onToast={onToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav (4 primary tabs + Menu drawer for all 7 pages) */}
      <nav className="mobile-bottom-nav" aria-label="Expert mobile navigation">
        {navItems
          .filter((item) => item.id === 'overview' || item.id === 'sessions' || item.id === 'messages' || item.id === 'wallet')
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.shortLabel ?? item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        <button
          type="button"
          className={`mobile-nav-btn ${
            activeTab === 'availability' || activeTab === 'resources' || activeTab === 'profile' ? 'active' : ''
          }`}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open all expert sections"
        >
          <Menu size={19} />
          <span>Sections</span>
        </button>
      </nav>

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Career Pilot"
        subtitle="Expert Studio"
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as ExpertDashboardTab)}
        groups={[
          {
            title: 'Expert Workspace',
            items: navItems.map((item) => ({
              id: item.id,
              label: item.label,
              icon: item.icon,
              badge: item.id === 'sessions' ? pendingCount : undefined,
            })),
          },
        ]}
        onSignOut={onSignOut}
      />
    </div>
  );
};
