import { supabase } from '../../lib/supabase';
import type { RolePlanOutline } from '../roadmap/careerCatalog';

export type AIFeature = 'coach' | 'cv' | 'interview' | 'role';

export type AIQuotaSummary = Record<AIFeature, { used: number; limit: number; remaining: number }>;

export function isRolePlanOutline(value: unknown, expectedRoleTitle: string): value is RolePlanOutline {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const outline = value as Partial<RolePlanOutline>;
  return typeof outline.role_title === 'string'
    && outline.role_title.trim().toLowerCase() === expectedRoleTitle.trim().toLowerCase()
    && Number.isFinite(outline.total_hours) && Number(outline.total_hours) >= 40 && Number(outline.total_hours) <= 480
    && Array.isArray(outline.milestones) && outline.milestones.length === 4
    && outline.milestones.every((milestone, index) => milestone && milestone.position === index + 1
      && typeof milestone.title === 'string' && milestone.title.trim().length > 0 && milestone.title.length <= 90
      && typeof milestone.focus === 'string' && milestone.focus.trim().length > 0 && milestone.focus.length <= 160
      && Array.isArray(milestone.skills) && milestone.skills.length >= 2 && milestone.skills.length <= 5
      && milestone.skills.every((skill) => typeof skill === 'string' && skill.trim().length > 0 && skill.length <= 70)
      && Number.isFinite(milestone.effort_hours) && milestone.effort_hours >= 5 && milestone.effort_hours <= 200)
    && outline.milestones.reduce((sum, milestone) => sum + milestone.effort_hours, 0) === outline.total_hours;
}

const featureLimits = {
  free: { coach: 15, cv: 5, interview: 5, role: 1 },
  premium: { coach: 100, cv: 40, interview: 40, role: 5 },
} as const;

export async function loadAIQuotaSummary(userId: string, plan: 'free' | 'premium'): Promise<AIQuotaSummary> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('ai_usage')
    .select('feature,created_at')
    .eq('user_id', userId)
    .gte('created_at', since);
  if (error) throw error;

  const used = { coach: 0, cv: 0, interview: 0, role: 0 };
  for (const row of data ?? []) {
    if (row.feature in used) used[row.feature as AIFeature] += 1;
  }
  const limits = featureLimits[plan];
  return {
    coach: { used: used.coach, limit: limits.coach, remaining: Math.max(0, limits.coach - used.coach) },
    cv: { used: used.cv, limit: limits.cv, remaining: Math.max(0, limits.cv - used.cv) },
    interview: { used: used.interview, limit: limits.interview, remaining: Math.max(0, limits.interview - used.interview) },
    role: { used: used.role, limit: limits.role, remaining: Math.max(0, limits.role - used.role) },
  };
}

interface AIGatewayResult<T> {
  source: 'model';
  cached: boolean;
  response: T;
  usage: {
    feature: AIFeature;
    tokens_in: number;
    tokens_out: number;
    remaining_quota: number;
  };
}

export async function requestAI<T>(feature: AIFeature, input: Record<string, unknown>): Promise<AIGatewayResult<T>> {
  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: { feature, input },
  });

  if (error) {
    const context = (error as Error & { context?: unknown }).context;
    if (context instanceof Response) {
      let payload: { error?: string; message?: string; request_id?: string } | null = null;
      try {
        payload = await context.clone().json() as { error?: string; message?: string; request_id?: string };
      } catch { /* Use the SDK error when the response isn't JSON. */ }
      const message = payload?.message || payload?.error || error.message || 'Could not contact the AI service.';
      const requestId = payload?.request_id || context.headers.get('x-request-id');
      throw new Error(requestId ? `${message} (Reference: ${requestId})` : message);
    }
    throw new Error(error.message || 'Could not contact the AI service.');
  }

  if (!data || typeof data !== 'object') throw new Error('The AI service returned an invalid response.');
  const payload = data as Partial<AIGatewayResult<T>> & { error?: string; message?: string };
  if (payload.error) throw new Error(payload.message || payload.error);
  if (!payload.response || !payload.usage) throw new Error('The AI service returned an incomplete response.');
  return payload as AIGatewayResult<T>;
}
