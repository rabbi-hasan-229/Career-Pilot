import { supabase } from '../../lib/supabase';
import type { Profile, Milestone, Task } from '../../types';

export async function exportAccountData(profile: Profile, milestones: Milestone[], tasks: Task[]): Promise<Record<string, unknown>> {
  if (profile.is_demo) {
    return {
      exported_at: new Date().toISOString(),
      account_type: 'development_demo',
      profile,
      milestones,
      tasks,
    };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== profile.id) {
    throw new Error('Your session expired. Sign in again before exporting your data.');
  }

  const safeOptional = async (run: () => PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
    const result = await run();
    if (result.error && /schema cache|does not exist|relation/i.test(result.error.message)) {
      return [];
    }
    if (result.error) throw new Error(result.error.message);
    return result.data ?? [];
  };

  const loadQuizSubmissions = async () => {
    const res = await supabase.from('quiz_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (res.error && /created_at/i.test(res.error.message)) {
      const legacy = await supabase.from('quiz_submissions').select('*').eq('user_id', user.id).order('passed_at', { ascending: true });
      if (!legacy.error) return legacy.data ?? [];
    }
    if (res.error && /schema cache|does not exist|relation/i.test(res.error.message)) return [];
    if (res.error) throw new Error(res.error.message);
    return res.data ?? [];
  };

  const [
    profileRes,
    roadmaps,
    savedMilestones,
    savedTasks,
    quizSubmissions,
    quizDefinitions,
    achievements,
    userSkills,
    cvDocuments,
    interviewAttempts,
    coachMessages,
    notifications,
    gamificationRes,
    aiUsage,
    legalAcceptances,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    safeOptional(() => supabase.from('user_roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: true })),
    safeOptional(() => supabase.from('milestones').select('*').eq('user_id', user.id).order('position', { ascending: true })),
    safeOptional(() => supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true })),
    loadQuizSubmissions(),
    safeOptional(() => supabase.from('task_quizzes_public').select('*')),
    safeOptional(() => supabase.from('user_achievements').select('*,achievements(title,description,tier)').eq('user_id', user.id).order('unlocked_at', { ascending: true })),
    safeOptional(() => supabase.from('user_skills').select('*,skills(name,category)').eq('user_id', user.id)),
    safeOptional(() => supabase.from('cv_documents').select('*').eq('user_id', user.id)),
    safeOptional(() => supabase.from('interview_attempts').select('*,interview_questions(question,round,difficulty)').eq('user_id', user.id).order('created_at', { ascending: true })),
    safeOptional(() => supabase.from('ai_coach_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true })),
    safeOptional(() => supabase.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: true })),
    supabase.from('user_gamification').select('*').eq('user_id', user.id).maybeSingle(),
    safeOptional(() => supabase.from('ai_usage').select('*').eq('user_id', user.id).order('created_at', { ascending: true })),
    safeOptional(() => supabase.from('legal_acceptances').select('terms_version,privacy_notice_version,accepted_at').eq('user_id', user.id).order('accepted_at', { ascending: true })),
  ]);

  if (profileRes.error) {
    throw new Error(`Could not export all account data: ${profileRes.error.message}`);
  }
  const profileRow = profileRes.data;
  const gamification = gamificationRes.error ? null : gamificationRes.data;
  return {
    exported_at: new Date().toISOString(),
    account_id: user.id,
    account_email: user.email,
    profile: profileRow,
    roadmaps,
    milestones: savedMilestones,
    tasks: savedTasks,
    quiz_submissions: quizSubmissions,
    checkpoint_questions: quizDefinitions,
    achievements,
    acquired_skills: userSkills,
    cv_documents: cvDocuments,
    interview_attempts: interviewAttempts,
    coach_messages: coachMessages,
    notifications,
    gamification,
    ai_usage: aiUsage,
    legal_acceptances: legalAcceptances,
  };
}

export function downloadAccountExport(data: Record<string, unknown>, role: string): void {
  const filenameRole = role.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'career';
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `career_pilot_export_${filenameRole}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
