import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { getSession, onAuthStateChange } from '../api/auth'
import { getOwnProfile } from '../api/profiles'
import type { Profile } from '../types/db'

interface AuthState {
  session: Session | null
  profile: Profile | null
  initialized: boolean
  init: () => Promise<void>
  refreshProfile: () => Promise<void>
  setProfile: (profile: Profile | null) => void
}

let initStarted = false

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,

  init: async () => {
    if (initStarted) return
    initStarted = true

    onAuthStateChange((session) => {
      const previousUser = get().session?.user.id
      set({ session })
      if (!session) {
        set({ profile: null })
      } else if (session.user.id !== previousUser) {
        void get().refreshProfile()
      }
    })

    const session = await getSession().catch(() => null)
    set({ session })
    if (session) {
      await get().refreshProfile().catch(() => undefined)
    }
    set({ initialized: true })
  },

  refreshProfile: async () => {
    const profile = await getOwnProfile()
    set({ profile })
  },

  setProfile: (profile) => set({ profile }),
}))
