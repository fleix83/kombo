import { create } from 'zustand'
import { listOwnCards } from '../api/cards'
import type { Card } from '../types/db'

interface CardsState {
  cards: Card[]
  activeCardId: string | null
  loading: boolean
  loaded: boolean
  load: () => Promise<void>
  setActiveCard: (id: string) => void
  upsertLocal: (card: Card) => void
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  activeCardId: null,
  loading: false,
  loaded: false,

  load: async () => {
    set({ loading: true })
    try {
      const cards = await listOwnCards()
      const { activeCardId } = get()
      const activeCards = cards.filter((c) => c.status === 'active')
      const stillValid = activeCards.some((c) => c.id === activeCardId)
      set({
        cards,
        loaded: true,
        activeCardId: stillValid ? activeCardId : (activeCards[0]?.id ?? null),
      })
    } finally {
      set({ loading: false })
    }
  },

  setActiveCard: (id) => set({ activeCardId: id }),

  upsertLocal: (card) => {
    const cards = get().cards
    const index = cards.findIndex((c) => c.id === card.id)
    const next =
      index === -1 ? [card, ...cards] : cards.map((c) => (c.id === card.id ? card : c))
    set({ cards: next.filter((c) => c.status !== 'deleted') })
  },
}))
