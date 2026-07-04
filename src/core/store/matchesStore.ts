import { create } from 'zustand'
import { getMatchesOverview } from '../api/matches'
import type { MatchOverview } from '../types/db'

interface MatchesState {
  overview: MatchOverview[]
  loading: boolean
  loaded: boolean
  load: () => Promise<void>
  totalUnread: () => number
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  overview: [],
  loading: false,
  loaded: false,

  load: async () => {
    set({ loading: true })
    try {
      const overview = await getMatchesOverview()
      set({ overview, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  totalUnread: () => get().overview.reduce((sum, m) => sum + m.unread_count, 0),
}))
