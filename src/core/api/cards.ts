import type { Card, CardInput, CardStatus, Profile } from '../types/db'
import { currentUserId } from './auth'
import { supabase } from './supabase'

export async function listOwnCards(): Promise<Card[]> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('cards')
    .select('*')
    .eq('owner_id', uid)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createCard(input: CardInput): Promise<Card> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('cards')
    .insert({ owner_id: uid, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCard(id: string, patch: Partial<CardInput>): Promise<Card> {
  const { data, error } = await supabase()
    .from('cards')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Pause / reactivate / delete. 'deleted' archives the card's matches via
// DB trigger (PRD §3.4) — rows are never removed.
export async function setCardStatus(id: string, status: CardStatus): Promise<Card> {
  const { data, error } = await supabase()
    .from('cards')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export type CardWithOwner = Card & { owner: Profile }

// Readable for own cards and cards one shares a match with (RLS)
export async function getCardWithOwner(id: string): Promise<CardWithOwner | null> {
  const { data, error } = await supabase()
    .from('cards')
    .select('*, owner:profiles(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as CardWithOwner | null
}
