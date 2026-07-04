import { create } from 'zustand'
import { getDeck } from '../api/deck'
import { recordSwipe } from '../api/swipes'
import type { DeckCard, SwipeDirection } from '../types/db'

const FETCH_SIZE = 20
const REFILL_THRESHOLD = 5

export interface MatchCelebration {
  matchId: string
  counterpart: DeckCard
}

interface DeckState {
  cardId: string | null // active card the deck belongs to
  queue: DeckCard[]
  loading: boolean
  exhausted: boolean
  celebration: MatchCelebration | null
  error: boolean
  load: (cardId: string) => Promise<void>
  swipe: (direction: SwipeDirection) => Promise<void>
  dismissCelebration: () => void
  reset: () => void
}

export const useDeckStore = create<DeckState>((set, get) => ({
  cardId: null,
  queue: [],
  loading: false,
  exhausted: false,
  celebration: null,
  error: false,

  load: async (cardId) => {
    set({ cardId, queue: [], exhausted: false, loading: true, error: false })
    try {
      const cards = await getDeck(cardId, FETCH_SIZE)
      // ignore stale responses after a card switch
      if (get().cardId !== cardId) return
      set({ queue: cards, exhausted: cards.length === 0, loading: false })
    } catch {
      if (get().cardId === cardId) set({ loading: false, error: true })
    }
  },

  swipe: async (direction) => {
    const { cardId, queue } = get()
    const target = queue[0]
    if (!cardId || !target) return

    set({ queue: queue.slice(1) })
    try {
      const matchId = await recordSwipe(cardId, target.card_id, direction)
      if (matchId) {
        set({ celebration: { matchId, counterpart: target } })
      }
    } catch {
      // swipe lost (e.g. offline) — card simply reappears on next deck load
    }

    const remaining = get().queue
    if (remaining.length < REFILL_THRESHOLD && !get().loading) {
      set({ loading: true })
      try {
        const more = await getDeck(cardId, FETCH_SIZE)
        if (get().cardId !== cardId) return
        const known = new Set(get().queue.map((c) => c.card_id))
        const fresh = more.filter((c) => !known.has(c.card_id) && c.card_id !== target.card_id)
        const next = [...get().queue, ...fresh]
        set({ queue: next, exhausted: next.length === 0, loading: false })
      } catch {
        set({ loading: false })
      }
    }
  },

  dismissCelebration: () => set({ celebration: null }),

  reset: () =>
    set({ cardId: null, queue: [], loading: false, exhausted: false, celebration: null, error: false }),
}))
