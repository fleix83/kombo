import { useEffect } from 'react'
import { markMatchRead } from '../../core/api/messages'
import { subscribeToMatches, subscribeToMessages } from '../../core/api/realtime'
import { useChatStore } from '../../core/store/chatStore'
import { useMatchesStore } from '../../core/store/matchesStore'

// Wires the two realtime subscriptions (PRD §6.3) into the stores:
// - messages: append if the chat is open (and mark read), else refresh the
//   matches overview so previews/unread badges update.
// - matches: refresh the overview → new-match badge for the passive user.
export function useRealtime(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const messages = subscribeToMessages((message) => {
      const chat = useChatStore.getState()
      if (chat.matchId === message.match_id) {
        chat.appendIncoming(message)
        if (message.sender_id !== chat.myUserId) {
          void markMatchRead(message.match_id).catch(() => undefined)
        }
      } else {
        void useMatchesStore.getState().load().catch(() => undefined)
      }
    })

    const matches = subscribeToMatches(() => {
      void useMatchesStore.getState().load().catch(() => undefined)
    })

    return () => {
      messages.unsubscribe()
      matches.unsubscribe()
    }
  }, [enabled])
}
