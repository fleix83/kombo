import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCardsStore } from '../core/store/cardsStore'
import { useDeckStore } from '../core/store/deckStore'
import { Button } from '../ui/components/Button'
import { MatchOverlay } from '../ui/components/MatchOverlay'
import { LoadingScreen } from '../ui/components/Spinner'
import { SwipeStack } from '../ui/components/SwipeStack'
import { de } from '../ui/i18n/de'

export function DeckPage() {
  const cards = useCardsStore((s) => s.cards)
  const cardsLoaded = useCardsStore((s) => s.loaded)
  const activeCardId = useCardsStore((s) => s.activeCardId)
  const setActiveCard = useCardsStore((s) => s.setActiveCard)

  const queue = useDeckStore((s) => s.queue)
  const loading = useDeckStore((s) => s.loading)
  const error = useDeckStore((s) => s.error)
  const celebration = useDeckStore((s) => s.celebration)
  const dismissCelebration = useDeckStore((s) => s.dismissCelebration)

  const activeCards = cards.filter((c) => c.status === 'active')
  const activeCard = activeCards.find((c) => c.id === activeCardId)

  useEffect(() => {
    if (activeCardId) void useDeckStore.getState().load(activeCardId)
  }, [activeCardId])

  if (!cardsLoaded) return <LoadingScreen />

  // no active card → deck impossible (PRD §3.3)
  if (activeCards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="text-lg font-semibold">{de.deck.noCards}</h1>
        <p className="mt-2 text-sm text-zinc-500">{de.deck.noCardsText}</p>
        <Link to="/karten/neu" className="mt-6">
          <Button>{de.deck.createCard}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* active-card switcher (PRD §5.4) */}
      <div className="border-b border-zinc-100 px-4 pb-3 pt-4">
        <p className="mb-2 text-xs font-medium text-zinc-400">{de.deck.swipingAs}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveCard(card.id)}
              className={`max-w-40 shrink-0 truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                card.id === activeCardId
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700'
              }`}
            >
              {card.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {queue.length > 0 ? (
          <SwipeStack
            cards={queue}
            onSwipe={(direction) => void useDeckStore.getState().swipe(direction)}
          />
        ) : loading ? (
          <LoadingScreen />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold">
              {error ? de.common.error : de.deck.empty}
            </h2>
            <p className="mt-2 max-w-64 text-sm text-zinc-500">
              {error ? de.common.offline : de.deck.emptyText}
            </p>
            {!error && activeCard?.type === 'project' && (
              <p className="mt-2 max-w-64 text-xs text-zinc-400">{de.deck.emptyProjectHint}</p>
            )}
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => activeCardId && void useDeckStore.getState().load(activeCardId)}
            >
              {error ? de.common.retry : de.deck.reload}
            </Button>
          </div>
        )}
      </div>

      {celebration && (
        <MatchOverlay celebration={celebration} onDismiss={dismissCelebration} />
      )}
    </div>
  )
}
