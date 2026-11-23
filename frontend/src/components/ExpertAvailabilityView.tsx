import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Save } from 'lucide-react';
import type { ExpertProfile } from '../types';
import { expertRepository } from '../features/experts/expertRepository';

interface Props {
  expertProfile: ExpertProfile;
  onProfileUpdated: (updated: ExpertProfile) => void;
  onToast: (msg: string) => void;
}

const WEEKDAYS = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
];

interface DayWindow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const ExpertAvailabilityView: React.FC<Props> = ({
  expertProfile,
  onProfileUpdated,
  onToast,
}) => {
  const [windows, setWindows] = useState<DayWindow[]>(() =>
    WEEKDAYS.map((w) => ({
      day_of_week: w.day,
      start_time: '09:00',
      end_time: '17:00',
      is_active: w.day >= 1 && w.day <= 5,
    }))
  );
  const [hourlyDollars, setHourlyDollars] = useState(() =>
    Math.round(expertProfile.hourly_rate_cents / 100)
  );
  const [defaultMeetingUrl, setDefaultMeetingUrl] = useState(
    expertProfile.default_meeting_url || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void expertRepository
      .loadExpertAvailability(expertProfile.user_id)
      .then((rows) => {
        if (!active || rows.length === 0) return;
        setWindows(
          WEEKDAYS.map((w) => {
            const match = rows.find((r) => r.day_of_week === w.day);
            return match
              ? {
                  day_of_week: w.day,
                  start_time: match.start_time.slice(0, 5),
                  end_time: match.end_time.slice(0, 5),
                  is_active: match.is_active,
                }
              : {
                  day_of_week: w.day,
                  start_time: '09:00',
                  end_time: '17:00',
                  is_active: false,
                };
          })
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [expertProfile.user_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const w of windows) {
      if (w.is_active && w.end_time <= w.start_time) {
        onToast('End time must be after start time for all active days.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await expertRepository.saveExpertAvailability(
        expertProfile.user_id,
        windows.filter((w) => w.is_active)
      );

      const nextRateCents = Math.max(500, Math.min(200000, Math.round(hourlyDollars * 100)));
      const updated = await expertRepository.saveExpertProfile({
        displayName: expertProfile.display_name,
        avatarUrl: expertProfile.avatar_url,
        headline: expertProfile.headline,
        bio: expertProfile.bio,
        currentCompany: expertProfile.current_company || undefined,
        location: expertProfile.location || undefined,
        timezone: expertProfile.timezone,
        yearsExperience: expertProfile.years_experience,
        categories: expertProfile.categories,
        targetRoles: expertProfile.target_roles,
        skills: expertProfile.skills,
        experiences: expertProfile.experiences,
        portfolioUrl: expertProfile.portfolio_url || undefined,
        linkedinUrl: expertProfile.linkedin_url || undefined,
        githubUrl: expertProfile.github_url || undefined,
        cvStoragePath: expertProfile.cv_storage_path,
        cvFilename: expertProfile.cv_filename,
        cvSummary: expertProfile.cv_summary || undefined,
        hourlyRateCents: nextRateCents,
        meetingModes: expertProfile.meeting_modes,
        offlineCities: expertProfile.offline_cities,
        offlineNotes: expertProfile.offline_notes || undefined,
        defaultMeetingUrl: defaultMeetingUrl.trim() || undefined,
        maxHoursPerSession: expertProfile.max_hours_per_session,
      });

      onProfileUpdated(updated);
      onToast('Availability schedule and hourly rate saved.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not save availability.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
      <section className="m3-surface-card" style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--md-primary)" />
          <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800 }}>Hourly Wage & Default Meeting Room</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
              Hourly Wage ($ USD / hour)
            </label>
            <input
              type="number"
              min={5}
              max={2000}
              value={hourlyDollars}
              onChange={(e) => setHourlyDollars(Math.max(5, Math.min(2000, Number(e.target.value) || 5)))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-text-primary)',
                fontSize: '14px',
                fontWeight: 700,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
              Default Online Meeting Link (Zoom / Meet)
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              value={defaultMeetingUrl}
              onChange={(e) => setDefaultMeetingUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-text-primary)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      </section>

      <section className="m3-surface-card" style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--md-primary)" />
            <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800 }}>Weekly Open Hours ({expertProfile.timezone})</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          {windows.map((win, idx) => {
            const label = WEEKDAYS.find((w) => w.day === win.day_of_week)?.label || '';
            return (
              <div
                key={win.day_of_week}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-outline)',
                  background: win.is_active ? 'var(--md-surface-variant)' : 'transparent',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '130px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={win.is_active}
                    onChange={(e) =>
                      setWindows((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, is_active: e.target.checked } : item))
                      )
                    }
                    style={{ width: 16, height: 16, accentColor: 'var(--md-primary)' }}
                  />
                  <span>{label}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="time"
                    disabled={!win.is_active}
                    value={win.start_time}
                    onChange={(e) =>
                      setWindows((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, start_time: e.target.value } : item))
                      )
                    }
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-primary)',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--md-text-muted)' }}>to</span>
                  <input
                    type="time"
                    disabled={!win.is_active}
                    value={win.end_time}
                    onChange={(e) =>
                      setWindows((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, end_time: e.target.value } : item))
                      )
                    }
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
          <button
            type="submit"
            className="btn-m3-primary"
            disabled={isSaving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Schedule & Rate'}</span>
          </button>
        </div>
      </section>
    </form>
  );
};
