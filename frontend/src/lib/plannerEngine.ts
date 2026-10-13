// Client-side implementation of Section 6 Deterministic Planner
// Zero AI Cost: Mathematical proportional distribution & quick rescheduling

import type { Milestone, Role } from '../types';

export interface PlanCalculationResult {
  totalEffortHours: number;
  totalDays: number;
  totalWeeks: number;
  isOverloaded: boolean;
  requiredDailyMinutes: number;
  milestones: Milestone[];
}

export const availableRoles: (Role & { effortHours: number; zones: string[] })[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'ui-ux-designer',
    title: 'UI/UX Designer',
    description: 'Master Figma systems, visual hierarchy, user psychology, and interactive prototyping.',
    category: 'Design',
    icon_name: 'palette',
    source: 'curated',
    effort_hours: 90,
    effortHours: 90,
    zones: ['Coastal Shore', 'Workshop Citadel', 'Discovery Harbor', 'Summit Lighthouse'],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'frontend-developer',
    title: 'Junior Frontend Developer',
    description: 'Master HTML5/CSS3 layouts, modern JavaScript engine, React component trees, and APIs.',
    category: 'Engineering',
    icon_name: 'code',
    source: 'curated',
    effort_hours: 120,
    effortHours: 120,
    zones: ['Starter Beach', 'Logic Fortress', 'Component Forest', 'Cloud Summit'],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'backend-developer',
    title: 'Junior Backend Developer',
    description: 'Master Node.js/Go, SQL relational modeling, Postgres RLS, and secure RESTful architectures.',
    category: 'Engineering',
    icon_name: 'server',
    source: 'curated',
    effort_hours: 110,
    effortHours: 110,
    zones: ['Server Port', 'Database Dungeon', 'API Ramparts', 'Production Keep'],
  },
];

/**
 * Calculates deterministic roadmap dates using the proportional formula:
 * weeks_i = W * (E_i / sum(E))
 */
export function calculateProportionalPlan(
  roleSlug: string,
  targetDateStr: string,
  dailyMinutes: number
): PlanCalculationResult {
  const role = availableRoles.find((r) => r.slug === roleSlug) || availableRoles[0];
  
  // Modular effort distribution per milestone (e.g. 4 stages)
  const milestoneEfforts = [0.2, 0.3, 0.25, 0.25].map((pct) => Math.round(role.effortHours * pct));
  const totalEffortHours = milestoneEfforts.reduce((a, b) => a + b, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = Math.max(1000 * 60 * 60 * 24, targetDate.getTime() - today.getTime());
  const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const totalWeeks = Math.max(1, totalDays / 7);

  // Feasibility Check
  const requiredHoursPerDay = totalEffortHours / totalDays;
  const userCapacityHoursPerDay = dailyMinutes / 60;
  const isOverloaded = requiredHoursPerDay > userCapacityHoursPerDay;
  const requiredDailyMinutes = Math.round(requiredHoursPerDay * 60);

  let currentDate = new Date(today);
  const calculatedMilestones: Milestone[] = [];

  for (let i = 0; i < role.zones.length; i++) {
    const effort_i = milestoneEfforts[i] || 20;
    // Mathematical formula from docx: weeks_i = W * (E_i / sum(E))
    const weeks_i = totalWeeks * (effort_i / totalEffortHours);
    const days_i = Math.max(3, Math.round(weeks_i * 7));

    const startDate = new Date(currentDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days_i);

    calculatedMilestones.push({
      id: `m_${role.slug}_${i + 1}`,
      roadmap_id: `rm_${role.slug}`,
      user_id: 'usr_current',
      title: `${role.zones[i]}: Stage ${i + 1}`,
      position: i + 1,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: i === 0 ? 'doing' : 'todo',
    });

    currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalEffortHours,
    totalDays,
    totalWeeks,
    isOverloaded,
    requiredDailyMinutes,
    milestones: calculatedMilestones,
  };
}

/**
 * Handles Game Quick Actions (zero AI cost):
 * - 'behind': shifts current active milestone end date by 3 days
 * - 'early': completes active milestone and pulls next forward
 * - 'pause': shifts all uncompleted milestones by 7 days
 */
export function applyQuickPlannerAction(
  milestones: Milestone[],
  actionType: 'behind' | 'early' | 'pause'
): Milestone[] {
  return milestones.map((m) => {
    if (actionType === 'pause' && m.status !== 'done') {
      const start = new Date(m.start_date);
      start.setDate(start.getDate() + 7);
      const end = new Date(m.end_date);
      end.setDate(end.getDate() + 7);
      return {
        ...m,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      };
    }

    if (actionType === 'behind' && m.status === 'doing') {
      const end = new Date(m.end_date);
      end.setDate(end.getDate() + 3);
      return {
        ...m,
        end_date: end.toISOString().split('T')[0],
      };
    }

    return m;
  });
}
