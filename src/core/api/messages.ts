import type { Message } from '../types/db'
import { currentUserId } from './auth'
import { supabase } from './supabase'

export async function listMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase()
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(matchId: string, content: string): Promise<Message> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('messages')
    .insert({ match_id: matchId, sender_id: uid, content })
    .select()
    .single()
  if (error) throw error
  return data
}

// Marks all counterpart messages of the match as read (RPC, PRD §5.6)
export async function markMatchRead(matchId: string): Promise<void> {
  const { error } = await supabase().rpc('mark_match_read', { p_match_id: matchId })
  if (error) throw error
}
