import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import type { MatchCelebration } from '../../core/store/deckStore'
import { de } from '../i18n/de'
import { Button } from './Button'
import { Doodle } from './Doodle'

// "It's a match" overlay with deep link into the chat (PRD §5.4).
export function MatchOverlay({
  celebration,
  onDismiss,
}: {
  celebration: MatchCelebration
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { counterpart, matchId } = celebration

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
        <h2 className="text-2xl font-bold">{de.match.title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{de.match.text}</p>

        <div className="my-6 flex items-center justify-center gap-4">
          <div className="rounded-full border border-zinc-200 bg-zinc-50 p-2">
            <Doodle url={profile?.drawing_url} className="h-16 w-16" />
          </div>
          <div className="rounded-full border border-zinc-200 bg-zinc-50 p-2">
            <Doodle
              url={counterpart.drawing_url ?? counterpart.owner_drawing_url}
              className="h-16 w-16"
            />
          </div>
        </div>

        <p className="text-sm font-medium">
          {counterpart.owner_name} · {counterpart.title}
        </p>

        <div className="mt-6 space-y-2">
          <Button
            full
            onClick={() => {
              onDismiss()
              navigate(`/chat/${matchId}`)
            }}
          >
            {de.match.sayHello}
          </Button>
          <Button variant="secondary" full onClick={onDismiss}>
            {de.match.keepSwiping}
          </Button>
        </div>
      </div>
    </div>
  )
}
