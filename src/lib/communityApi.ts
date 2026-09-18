import { supabase } from './supabase'

export type ReportType =
  | 'could_use'
  | 'closed'
  | 'purchase_required'
  | 'pass_required'
  | 'wrong_location'
  | 'missing_paper'
  | 'cleanliness'

async function authenticatedUserId() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Inicia sesión para continuar.')
  return data.user.id
}

export async function getOwnProfile() {
  const userId = await authenticatedUserId()
  const { data, error } = await supabase!
    .from('profiles')
    .select('display_name, avatar_key')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as { display_name: string | null; avatar_key: string }
}

export async function updateOwnProfile(displayName: string) {
  const userId = await authenticatedUserId()
  const { error } = await supabase!
    .from('profiles')
    .update({ display_name: displayName.trim() || null })
    .eq('id', userId)
  if (error) throw error
}

export async function syncFavorites(localIds: string[]) {
  const userId = await authenticatedUserId()
  if (localIds.length > 0) {
    const { error } = await supabase!
      .from('favorites')
      .upsert(localIds.map((restroomId) => ({ user_id: userId, restroom_id: restroomId })), {
        onConflict: 'user_id,restroom_id',
      })
    if (error) throw error
  }
  const { data, error } = await supabase!
    .from('favorites')
    .select('restroom_id')
    .eq('user_id', userId)
  if (error) throw error
  return data.map((row) => row.restroom_id as string)
}

export async function submitReport(input: {
  restroomId: string
  type: ReportType
  observationAt: string
  details?: string
}) {
  const userId = await authenticatedUserId()
  const { data, error } = await supabase!
    .from('restroom_reports')
    .insert({
      restroom_id: input.restroomId,
      reporter_id: userId,
      report_type: input.type,
      observation_at: input.observationAt,
      details: input.details?.trim() || null,
    })
    .select('id, status, submitted_at')
    .single()
  if (error) throw error
  return data
}

export async function submitReview(input: {
  restroomId: string
  cleanliness: number
  observationAt: string
  comment?: string
}) {
  const userId = await authenticatedUserId()
  const { data, error } = await supabase!
    .from('restroom_reviews')
    .insert({
      restroom_id: input.restroomId,
      author_id: userId,
      cleanliness: input.cleanliness,
      observation_at: input.observationAt,
      comment: input.comment?.trim() || null,
    })
    .select('id, status, submitted_at')
    .single()
  if (error) throw error
  return data
}
