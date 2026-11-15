import { supabase } from '../../lib/supabase';
import { getLocalDateOnly } from '../../lib/dateOnly';
import { authService } from '../auth/authService';
import type { Milestone, Profile, Task, TaskQuiz } from '../../types';

type DatabaseMilestone = {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  position: number;
  start_date: string;
  end_date: string;
  status: Milestone['status'];
  effort_hours?: number | null;
  island_zone?: string;
  skills_covered?: string[];
};

type DatabaseTask = {
  id: string;
  milestone_id: string;
  user_id: string;
  title: string;
  subject?: string;
  task_type?: Task['type'];
  due_date: string;
  est_minutes: number;
  progress_pct?: number;
  done_at: string | null;
  deliverable?: string | null;
  resource_id: string | null;
  resources?: { id: string; title: string; url: string | null; provider: string | null } | null;
};

type DatabaseQuiz = {
  id: string;
  task_id: string;
  question: string;
  options: TaskQuiz['options'];
};

interface RoadmapMetaCache {
  milestones: Record<number, { effort_hours?: number; skills_covered?: string[] }>;
  tasks: Record<string, { subject?: string; type?: Task['type']; deliverable?: string; quiz?: TaskQuiz }>;
}

const ROADMAP_META_PREFIX = 'career_pilot_roadmap_meta_';
const CORE_MILESTONE_SELECT = 'id, roadmap_id, user_id, title, position, start_date, end_date, status';
const FULL_MILESTONE_SELECT =
  'id, roadmap_id, user_id, title, position, start_date, end_date, status, effort_hours, island_zone, skills_covered';
const CORE_TASK_SELECT = 'id, milestone_id, user_id, title, resource_id, due_date, est_minutes, xp_reward, done_at';
const FULL_TASK_SELECT =
  'id, milestone_id, user_id, title, subject, task_type, due_date, est_minutes, progress_pct, done_at, deliverable, resource_id, resources!tasks_resource_id_fkey(id,title,url,provider)';

function isSchemaMismatchError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return (
    code === 'PGRST200' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    code === '42883' ||
    code === '42P01' ||
    /does not exist|schema cache|could not find (the|a) (function|table|column|relationship)/i.test(msg)
  );
}

function readRoadmapMetaCache(userId: string): RoadmapMetaCache {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { milestones: {}, tasks: {} };
    }
    const raw = window.localStorage.getItem(`${ROADMAP_META_PREFIX}${userId}`);
    if (!raw) return { milestones: {}, tasks: {} };
    const parsed = JSON.parse(raw) as Partial<RoadmapMetaCache>;
    return {
      milestones: parsed.milestones && typeof parsed.milestones === 'object' ? parsed.milestones : {},
      tasks: parsed.tasks && typeof parsed.tasks === 'object' ? parsed.tasks : {},
    };
  } catch {
    return { milestones: {}, tasks: {} };
  }
}

function saveRoadmapMetaCache(userId: string, milestones: Milestone[], tasks: Task[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const positionById = new Map(milestones.map((m) => [m.id, m.position]));
    const cache: RoadmapMetaCache = {
      milestones: {},
      tasks: {},
    };
    for (const m of milestones) {
      cache.milestones[m.position] = {
        effort_hours: m.effort_hours,
        skills_covered: m.skills_covered,
      };
    }
    for (const t of tasks) {
      const pos = positionById.get(t.milestone_id) ?? 0;
      const meta = {
        subject: t.subject,
        type: t.type,
        deliverable: t.deliverable,
        quiz: t.quiz,
      };
      cache.tasks[`${pos}::${t.title}`] = meta;
      if (!cache.tasks[t.title]) {
        cache.tasks[t.title] = meta;
      }
    }
    window.localStorage.setItem(`${ROADMAP_META_PREFIX}${userId}`, JSON.stringify(cache));
  } catch {
    // Non-blocking fallback cache
  }
}

function toMilestone(row: DatabaseMilestone, metaCache: RoadmapMetaCache): Milestone {
  const cached = metaCache.milestones[row.position];
  return {
    id: row.id,
    roadmap_id: row.roadmap_id,
    user_id: row.user_id,
    title: row.title,
    position: row.position,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    effort_hours: row.effort_hours ?? cached?.effort_hours,
    skills_covered: row.skills_covered || cached?.skills_covered || [],
    week_range: `Week ${row.position}`,
  };
}

function toTask(
  row: DatabaseTask,
  milestonePosition: number,
  metaCache: RoadmapMetaCache,
  quiz?: TaskQuiz
): Task {
  const cached = metaCache.tasks[`${milestonePosition}::${row.title}`] || metaCache.tasks[row.title];
  return {
    id: row.id,
    milestone_id: row.milestone_id,
    user_id: row.user_id,
    title: row.title,
    subject: row.subject || cached?.subject || 'Career skills',
    type: row.task_type || cached?.type || 'Learn',
    due_date: row.due_date,
    est_minutes: row.est_minutes ?? 30,
    progress_pct: row.progress_pct ?? (row.done_at ? 100 : 0),
    done_at: row.done_at,
    deliverable: row.deliverable || cached?.deliverable || undefined,
    resource: row.resources || undefined,
    quiz: quiz || cached?.quiz,
  };
}

export async function loadActiveRoadmap(
  userId: string
): Promise<{ milestones: Milestone[]; tasks: Task[]; targetDate?: string } | null> {
  const { data: activeRoadmap, error: roadmapError } = await supabase
    .from('user_roadmaps')
    .select('id, target_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (roadmapError) throw roadmapError;

  let roadmap = activeRoadmap as { id: string; target_date?: string } | null;
  if (!roadmap) {
    const { data: completedRoadmap, error: completedError } = await supabase
      .from('user_roadmaps')
      .select('id, target_date')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (completedError) throw completedError;
    roadmap = completedRoadmap as { id: string; target_date?: string } | null;
  }
  if (!roadmap) return null;

  const metaCache = readRoadmapMetaCache(userId);

  const milestoneFullRes = await supabase
    .from('milestones')
    .select(FULL_MILESTONE_SELECT)
    .eq('roadmap_id', roadmap.id)
    .eq('user_id', userId)
    .order('position', { ascending: true });

  let milestoneRows: unknown = milestoneFullRes.data;
  let milestoneError = milestoneFullRes.error;
  if (isSchemaMismatchError(milestoneError)) {
    const milestoneCoreRes = await supabase
      .from('milestones')
      .select(CORE_MILESTONE_SELECT)
      .eq('roadmap_id', roadmap.id)
      .eq('user_id', userId)
      .order('position', { ascending: true });
    milestoneRows = milestoneCoreRes.data;
    milestoneError = milestoneCoreRes.error;
  }
  if (milestoneError) throw milestoneError;

  const dbMilestones = (milestoneRows || []) as unknown as DatabaseMilestone[];
  const milestones = dbMilestones.map((row) => toMilestone(row, metaCache));
  if (milestones.length === 0) return null;

  const positionByMilestoneId = new Map(milestones.map((m) => [m.id, m.position]));
  const milestoneIds = milestones.map((milestone) => milestone.id);

  const taskFullRes = await supabase
    .from('tasks')
    .select(FULL_TASK_SELECT)
    .in('milestone_id', milestoneIds)
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

  let taskRows: unknown = taskFullRes.data;
  let taskError = taskFullRes.error;
  if (isSchemaMismatchError(taskError)) {
    const taskCoreRes = await supabase
      .from('tasks')
      .select(CORE_TASK_SELECT)
      .in('milestone_id', milestoneIds)
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    taskRows = taskCoreRes.data;
    taskError = taskCoreRes.error;
  }
  if (taskError) throw taskError;

  const dbTasks = (taskRows || []) as unknown as DatabaseTask[];
  const taskIds = dbTasks.map((task) => task.id);
  let quizByTask = new Map<string, TaskQuiz>();
  if (taskIds.length > 0) {
    let quizQuery = await supabase
      .from('task_quizzes_public')
      .select('id, task_id, question, options')
      .in('task_id', taskIds);

    if (isSchemaMismatchError(quizQuery.error)) {
      quizQuery = await supabase
        .from('task_quizzes')
        .select('id, task_id, question, options')
        .in('task_id', taskIds);
    }

    if (!quizQuery.error) {
      const dbQuizzes = (quizQuery.data || []) as unknown as DatabaseQuiz[];
      quizByTask = new Map(
        dbQuizzes.map((row) => [
          row.task_id,
          {
            id: row.id,
            task_id: row.task_id,
            question: row.question,
            options: row.options,
            explanation: '',
          },
        ])
      );
    }
  }

  return {
    milestones,
    tasks: dbTasks.map((task) =>
      toTask(task, positionByMilestoneId.get(task.milestone_id) ?? 0, metaCache, quizByTask.get(task.id))
    ),
    targetDate: roadmap.target_date,
  };
}

async function createRoadmapViaTables(
  profile: Profile,
  milestones: Milestone[],
  tasks: Task[]
): Promise<{ milestones: Milestone[]; tasks: Task[]; targetDate?: string }> {
  await supabase
    .from('user_roadmaps')
    .update({ status: 'paused' })
    .eq('user_id', profile.id)
    .eq('status', 'active');

  const { data: roadmapRow, error: roadmapError } = await supabase
    .from('user_roadmaps')
    .insert({
      user_id: profile.id,
      target_date: profile.target_completion_date,
      status: 'active',
    })
    .select('id')
    .single();

  if (roadmapError || !roadmapRow) {
    throw roadmapError || new Error('Could not create active roadmap.');
  }

  const fullMilestonePayloads = milestones.map((m) => ({
    roadmap_id: roadmapRow.id,
    user_id: profile.id,
    title: m.title,
    position: m.position,
    start_date: m.start_date,
    end_date: m.end_date,
    status: m.status,
    effort_hours: m.effort_hours ?? null,
    skills_covered: m.skills_covered || [],
  }));

  let insertedMilestonesRes = await supabase
    .from('milestones')
    .insert(fullMilestonePayloads)
    .select('id, position');

  if (isSchemaMismatchError(insertedMilestonesRes.error)) {
    const coreMilestonePayloads = milestones.map((m) => ({
      roadmap_id: roadmapRow.id,
      user_id: profile.id,
      title: m.title,
      position: m.position,
      start_date: m.start_date,
      end_date: m.end_date,
      status: m.status,
    }));
    insertedMilestonesRes = await supabase
      .from('milestones')
      .insert(coreMilestonePayloads)
      .select('id, position');
  }

  if (insertedMilestonesRes.error || !insertedMilestonesRes.data) {
    throw insertedMilestonesRes.error || new Error('Could not save roadmap milestones.');
  }

  const dbIdByPosition = new Map<number, string>();
  for (const row of insertedMilestonesRes.data as Array<{ id: string; position: number }>) {
    dbIdByPosition.set(row.position, row.id);
  }
  const dbIdByLocalId = new Map<string, string>();
  for (const milestone of milestones) {
    const matchedId = dbIdByPosition.get(milestone.position);
    if (matchedId) dbIdByLocalId.set(milestone.id, matchedId);
  }

  const mappedTasks = tasks
    .map((task) => {
      const milestoneId = dbIdByLocalId.get(task.milestone_id);
      if (!milestoneId) return null;
      return { task, milestoneId };
    })
    .filter((entry): entry is { task: Task; milestoneId: string } => entry !== null);

  if (mappedTasks.length > 0) {
    const fullTaskPayloads = mappedTasks.map(({ task, milestoneId }) => ({
      milestone_id: milestoneId,
      user_id: profile.id,
      title: task.title,
      subject: task.subject,
      task_type: task.type,
      due_date: task.due_date,
      est_minutes: task.est_minutes,
      progress_pct: task.progress_pct,
      done_at: task.done_at,
      deliverable: task.deliverable || null,
    }));

    let taskInsertRes = await supabase.from('tasks').insert(fullTaskPayloads);
    if (isSchemaMismatchError(taskInsertRes.error)) {
      const coreTaskPayloads = mappedTasks.map(({ task, milestoneId }) => ({
        milestone_id: milestoneId,
        user_id: profile.id,
        title: task.title,
        due_date: task.due_date,
        est_minutes: task.est_minutes,
        done_at: task.done_at,
      }));
      taskInsertRes = await supabase.from('tasks').insert(coreTaskPayloads);
    }

    if (taskInsertRes.error) {
      throw taskInsertRes.error;
    }
  }

  const saved = await loadActiveRoadmap(profile.id);
  if (!saved) {
    throw new Error('The roadmap was created but could not be reloaded. Refresh and try again.');
  }
  return saved;
}

export async function createRoadmap(
  profile: Profile,
  milestones: Milestone[],
  tasks: Task[]
): Promise<{ milestones: Milestone[]; tasks: Task[]; targetDate?: string }> {
  if (!profile.target_role || !profile.target_completion_date) {
    throw new Error('Complete your career goal and target date before creating a roadmap.');
  }

  saveRoadmapMetaCache(profile.id, milestones, tasks);
  const { payloadMilestones, payloadTasks } = serializeRoadmap(milestones, tasks);

  const { error } = await supabase.rpc('create_user_roadmap', {
    p_target_role: profile.target_role,
    p_target_date: profile.target_completion_date,
    p_milestones: payloadMilestones,
    p_tasks: payloadTasks,
  });

  if (error) {
    if (isSchemaMismatchError(error)) {
      return createRoadmapViaTables(profile, milestones, tasks);
    }
    throw error;
  }

  const saved = await loadActiveRoadmap(profile.id);
  if (!saved) throw new Error('The roadmap was created but could not be reloaded. Refresh and try again.');
  return saved;
}

function serializeRoadmap(milestones: Milestone[], tasks: Task[]) {
  const payloadMilestones = milestones.map((milestone) => ({
    local_id: milestone.id,
    title: milestone.title,
    position: milestone.position,
    start_date: milestone.start_date,
    end_date: milestone.end_date,
    status: milestone.status,
    effort_hours: milestone.effort_hours,
    skills_covered: milestone.skills_covered || [],
  }));
  const payloadTasks = tasks.map((task) => ({
    milestone_local_id: task.milestone_id,
    title: task.title,
    subject: task.subject,
    task_type: task.type,
    due_date: task.due_date,
    est_minutes: task.est_minutes,
    progress_pct: task.progress_pct,
    done_at: task.done_at,
    deliverable: task.deliverable,
    quiz_template_id: task.quiz_template_id,
  }));
  return { payloadMilestones, payloadTasks };
}

export async function saveCareerPlan(profile: Profile, milestones: Milestone[], tasks: Task[]): Promise<void> {
  if (
    !profile.target_role ||
    !profile.target_role_category ||
    !profile.target_completion_date ||
    !profile.target_timeline_months ||
    !profile.experience_level
  ) {
    throw new Error('Complete your career goal and roadmap preferences before saving the plan.');
  }

  saveRoadmapMetaCache(profile.id, milestones, tasks);
  const { payloadMilestones, payloadTasks } = serializeRoadmap(milestones, tasks);
  const { error } = await supabase.rpc('save_user_career_plan', {
    p_target_role: profile.target_role,
    p_target_role_category: profile.target_role_category,
    p_target_timeline_months: profile.target_timeline_months,
    p_target_date: profile.target_completion_date,
    p_daily_minutes: profile.daily_minutes,
    p_experience_level: profile.experience_level,
    p_milestones: payloadMilestones,
    p_tasks: payloadTasks,
  });

  if (error) {
    if (isSchemaMismatchError(error)) {
      await authService.saveOnboardingGoal(profile, {
        target_role: profile.target_role,
        target_role_category: profile.target_role_category,
        target_timeline_months: profile.target_timeline_months,
        target_completion_date: profile.target_completion_date,
        daily_minutes: profile.daily_minutes,
        experience_level: profile.experience_level,
      });
      await createRoadmap(profile, milestones, tasks);
      return;
    }
    throw error;
  }
}

export async function completeTask(
  taskId: string
): Promise<{ already_completed: boolean; xp_awarded: number; current_streak: number | null }> {
  const { data, error } = await supabase.rpc('complete_user_task', { p_task_id: taskId });
  if (error) {
    if (isSchemaMismatchError(error)) {
      const nowIso = new Date().toISOString();
      let updateRes = await supabase
        .from('tasks')
        .update({ done_at: nowIso, progress_pct: 100 })
        .eq('id', taskId)
        .select('xp_reward')
        .maybeSingle();

      if (isSchemaMismatchError(updateRes.error)) {
        updateRes = await supabase
          .from('tasks')
          .update({ done_at: nowIso })
          .eq('id', taskId)
          .select('xp_reward')
          .maybeSingle();
      }
      if (updateRes.error) throw updateRes.error;
      const xp = Number((updateRes.data as { xp_reward?: number } | null)?.xp_reward ?? 25);
      return { already_completed: false, xp_awarded: xp, current_streak: null };
    }
    throw error;
  }
  return data as { already_completed: boolean; xp_awarded: number; current_streak: number | null };
}

export async function addSkillTask(userId: string, skillName: string): Promise<void> {
  const { data: milestone, error: milestoneError } = await supabase
    .from('milestones')
    .select('id,start_date,end_date,user_roadmaps!inner(status)')
    .eq('user_id', userId)
    .neq('status', 'done')
    .eq('user_roadmaps.status', 'active')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (milestoneError) throw milestoneError;
  if (!milestone) throw new Error('Create a roadmap before adding a skill task.');

  const today = getLocalDateOnly();
  const dueDate = milestone.start_date > today ? milestone.start_date : today;
  const fullPayload = {
    milestone_id: milestone.id,
    user_id: userId,
    title: `Develop ${skillName}`,
    subject: skillName,
    task_type: 'Learn',
    due_date: dueDate,
    est_minutes: 45,
    deliverable: `Complete a practical learning activity and record evidence of your ${skillName} progress.`,
  };

  let { error } = await supabase.from('tasks').insert(fullPayload);
  if (isSchemaMismatchError(error)) {
    const corePayload = {
      milestone_id: milestone.id,
      user_id: userId,
      title: `Develop ${skillName}`,
      due_date: dueDate,
      est_minutes: 45,
    };
    const fallbackRes = await supabase.from('tasks').insert(corePayload);
    error = fallbackRes.error;
  }
  if (error) throw error;
}

export async function addResourceTask(
  userId: string,
  resource: { id: string; title: string; category: string | null }
): Promise<boolean> {
  const { data: existingTask, error: duplicateError } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('resource_id', resource.id)
    .limit(1)
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (existingTask) return false;

  const { data: milestone, error: milestoneError } = await supabase
    .from('milestones')
    .select('id,start_date,user_roadmaps!inner(status)')
    .eq('user_id', userId)
    .neq('status', 'done')
    .eq('user_roadmaps.status', 'active')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (milestoneError) throw milestoneError;
  if (!milestone) throw new Error('Create a roadmap before adding a learning resource.');

  const today = getLocalDateOnly();
  const dueDate = milestone.start_date > today ? milestone.start_date : today;
  const fullPayload = {
    milestone_id: milestone.id,
    user_id: userId,
    resource_id: resource.id,
    title: `Study: ${resource.title}`.slice(0, 180),
    subject: resource.category || 'Career skills',
    task_type: 'Learn',
    due_date: dueDate,
    est_minutes: 30,
    deliverable: 'Work through the linked resource and record one key learning with a practical example.',
  };

  let { error } = await supabase.from('tasks').insert(fullPayload);
  if (isSchemaMismatchError(error)) {
    const corePayload = {
      milestone_id: milestone.id,
      user_id: userId,
      resource_id: resource.id,
      title: `Study: ${resource.title}`.slice(0, 180),
      due_date: dueDate,
      est_minutes: 30,
    };
    const fallbackRes = await supabase.from('tasks').insert(corePayload);
    error = fallbackRes.error;
  }
  if (error) throw error;
  return true;
}
