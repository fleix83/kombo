import { supabase } from './supabase'

// Blocks the user and archives all shared matches (security definer RPC).
// Both users' cards disappear from each other's decks immediately (PRD §5.7).
export async function blockUser(blockedUserId: string): Promise<void> {
  const { error } = await supabase().rpc('block_user', { p_blocked_id: blockedUserId })
  if (error) throw error
}
