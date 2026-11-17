import { supabase } from '../../lib/supabase';
import type { CVData } from '../../types';

const LOCAL_CV_PREFIX = 'career_pilot_cv_doc_';

function isMissingCVTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  );
}

function loadLocalCV(userId: string): { id: string; data: CVData } | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${LOCAL_CV_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; data?: CVData };
    if (!parsed?.data) return null;
    return { id: parsed.id || `local-cv-${userId}`, data: parsed.data };
  } catch {
    return null;
  }
}

function saveLocalCV(userId: string, cvId: string | null, data: CVData): string {
  const id = cvId || `local-cv-${userId}`;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${LOCAL_CV_PREFIX}${userId}`, JSON.stringify({ id, data }));
    }
  } catch {
    // Ignore storage quota issues cleanly
  }
  return id;
}

export async function loadCV(userId: string): Promise<{ id: string; data: CVData } | null> {
  const { data, error } = await supabase
    .from('cv_documents')
    .select('id, data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingCVTableError(error)) return loadLocalCV(userId);
    throw error;
  }
  if (!data) return loadLocalCV(userId);
  return { id: data.id, data: data.data as CVData };
}

export async function saveCV(userId: string, cvId: string | null, data: CVData): Promise<string> {
  const payload = { title: data.headline.trim() || 'Career Pilot Resume', data, updated_at: new Date().toISOString() };
  if (cvId && !cvId.startsWith('local-cv-')) {
    const { data: row, error } = await supabase
      .from('cv_documents')
      .update(payload)
      .eq('id', cvId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) {
      if (isMissingCVTableError(error)) return saveLocalCV(userId, cvId, data);
      throw error;
    }
    if (!row) throw new Error('Resume not found for this account.');
    saveLocalCV(userId, row.id, data);
    return row.id;
  }

  const { data: row, error } = await supabase
    .from('cv_documents')
    .insert({ ...payload, user_id: userId })
    .select('id')
    .single();
  if (error) {
    if (isMissingCVTableError(error)) return saveLocalCV(userId, cvId, data);
    throw error;
  }
  saveLocalCV(userId, row.id, data);
  return row.id;
}
