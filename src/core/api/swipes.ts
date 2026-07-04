import type { SwipeDirection } from '../types/db'
import { supabase } from './supabase'

// Inserts the swipe; the DB trigger creates the match if reciprocal.
// Returns the match id if this swipe completed a match, else null.
export async function recordSwipe(
  swiperCardId: string,
  targetCardId: string,
  direction: SwipeDirection,
): Promise<string | null> {
  const { data, error } = await supabase().rpc('record_swipe', {
    p_swiper_card_id: swiperCardId,
    p_target_card_id: targetCardId,
    p_direction: direction,
  })
  if (error) throw error
  return (data as string | null) ?? null
}
