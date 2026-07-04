import type { Match, Message } from '../types/db'
import { supabase } from './supabase'

// Callback-based subscription interface so this ports to React Native
// unchanged (PRD §6.3). RLS decides which rows each subscriber receives.

export interface RealtimeHandle {
  unsubscribe: () => void
}

export function subscribeToMessages(onInsert: (message: Message) => void): RealtimeHandle {
  const channel = supabase()
    .channel('messages-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe()
  return { unsubscribe: () => void supabase().removeChannel(channel) }
}

export function subscribeToMatches(onInsert: (match: Match) => void): RealtimeHandle {
  const channel = supabase()
    .channel('matches-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matches' },
      (payload) => onInsert(payload.new as Match),
    )
    .subscribe()
  return { unsubscribe: () => void supabase().removeChannel(channel) }
}
