import type { Match, MatchOverview } from '../types/db'
import { supabase } from './supabase'

export async function getMatchesOverview(): Promise<MatchOverview[]> {
  const { data, error } = await supabase().rpc('get_matches_overview')
  if (error) throw error
  return data as MatchOverview[]
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const { data, error } = await supabase()
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle()
  if (error) throw error
  return data
}
