import { supabase } from './supabase'
import { deleteAllOwnDrawings } from './storage'

// GDPR self-service deletion (PRD §2, §5.8): storage first (API delete removes
// the real files), then the auth.users row — everything else cascades in SQL.
export async function deleteAccount(): Promise<void> {
  await deleteAllOwnDrawings()
  const { error } = await supabase().rpc('delete_account')
  if (error) throw error
  // Session is invalid now; clear local state, ignore failures.
  await supabase().auth.signOut().catch(() => undefined)
}
