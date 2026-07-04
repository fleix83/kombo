import type { DeckCard } from '../types/db'
import { supabase } from './supabase'

// Server-side deck query (PRD §4.2) — all filtering happens in the RPC.
export async function getDeck(activeCardId: string, limit = 20): Promise<DeckCard[]> {
  const { data, error } = await supabase().rpc('get_deck', {
    p_card_id: activeCardId,
    p_limit: limit,
  })
  if (error) throw error
  return data as DeckCard[]
}
