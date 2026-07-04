import { create } from 'zustand'
import { currentUserId } from '../api/auth'
import { getCardWithOwner, type CardWithOwner } from '../api/cards'
import { getMatch } from '../api/matches'
import { listMessages, markMatchRead, sendMessage } from '../api/messages'
import type { MatchStatus, Message } from '../types/db'

interface ChatState {
  matchId: string | null
  matchStatus: MatchStatus | null
  myUserId: string | null
  myCardId: string | null
  counterpart: CardWithOwner | null
  messages: Message[]
  loading: boolean
  notFound: boolean
  load: (matchId: string) => Promise<void>
  send: (content: string) => Promise<void>
  appendIncoming: (message: Message) => void
  setArchived: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  matchId: null,
  matchStatus: null,
  myUserId: null,
  myCardId: null,
  counterpart: null,
  messages: [],
  loading: false,
  notFound: false,

  load: async (matchId) => {
    set({
      matchId,
      matchStatus: null,
      counterpart: null,
      messages: [],
      loading: true,
      notFound: false,
    })
    try {
      const [uid, match] = await Promise.all([currentUserId(), getMatch(matchId)])
      if (!match) {
        set({ notFound: true, loading: false })
        return
      }
      // Figure out which side is ours: one of the two cards has a readable
      // owner_id equal to us — resolve via the counterpart card fetch below.
      const [cardA, cardB] = await Promise.all([
        getCardWithOwner(match.card_a_id),
        getCardWithOwner(match.card_b_id),
      ])
      const mine = cardA?.owner_id === uid ? cardA : cardB
      const other = cardA?.owner_id === uid ? cardB : cardA
      const messages = await listMessages(matchId)
      if (get().matchId !== matchId) return
      set({
        matchStatus: match.status,
        myUserId: uid,
        myCardId: mine?.id ?? null,
        counterpart: other,
        messages,
        loading: false,
      })
      await markMatchRead(matchId).catch(() => undefined)
    } catch {
      if (get().matchId === matchId) set({ notFound: true, loading: false })
    }
  },

  send: async (content) => {
    const { matchId } = get()
    if (!matchId) return
    const message = await sendMessage(matchId, content)
    if (get().matchId === matchId) {
      set({ messages: [...get().messages, message] })
    }
  },

  appendIncoming: (message) => {
    const { matchId, messages } = get()
    if (message.match_id !== matchId) return
    if (messages.some((m) => m.id === message.id)) return
    set({ messages: [...messages, message] })
  },

  setArchived: () => set({ matchStatus: 'archived' }),

  reset: () =>
    set({
      matchId: null,
      matchStatus: null,
      myUserId: null,
      myCardId: null,
      counterpart: null,
      messages: [],
      loading: false,
      notFound: false,
    }),
}))
