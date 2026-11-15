import { supabase } from '../../lib/supabase';
import type { CVData } from '../../types';

export async function loadCV(userId: string): Promise<{ id: string; data: CVData } | null> {
  const { data, error } = await supabase
    .from('cv_documents')
    .select('id, data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, data: data.data as CVData };
}

export async function saveCV(userId: string, cvId: string | null, data: CVData): Promise<string> {
  const payload = { title: data.headline.trim() || 'Career Pilot Resume', data, updated_at: new Date().toISOString() };
  if (cvId) {
    const { data: row, error } = await supabase
      .from('cv_documents')
      .update(payload)
      .eq('id', cvId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error('Resume not found for this account.');
    return row.id;
  }

  const { data: row, error } = await supabase
    .from('cv_documents')
    .insert({ ...payload, user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return row.id;
}
