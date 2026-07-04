import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setCardStatus } from '../core/api/cards'
import { useCardsStore } from '../core/store/cardsStore'
import { useMatchesStore } from '../core/store/matchesStore'
import type { Card } from '../core/types/db'
import { Button } from '../ui/components/Button'
import { ConfirmDialog } from '../ui/components/ConfirmDialog'
import { Doodle } from '../ui/components/Doodle'
import { LoadingScreen } from '../ui/components/Spinner'
import { TypeBadge } from '../ui/components/TypeBadge'
import { de } from '../ui/i18n/de'

function CardRow({ card, matchCount }: { card: Card; matchCount: number }) {
  const navigate = useNavigate()
  const upsertLocal = useCardsStore((s) => s.upsertLocal)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function changeStatus(status: 'active' | 'paused' | 'deleted') {
    setBusy(true)
    try {
      const updated = await setCardStatus(card.id, status)
      upsertLocal(updated)
      if (status === 'deleted') {
        await useCardsStore.getState().load()
        await useMatchesStore.getState().load().catch(() => undefined)
      }
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const paused = card.status === 'paused'

  return (
    <div className={`rounded-2xl border border-zinc-200 p-4 ${paused ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Doodle url={card.drawing_url} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={card.type} />
            <span className="text-xs text-zinc-500">
              {paused ? de.cards.statusPaused : de.cards.statusActive} · {matchCount}{' '}
              {de.cards.matches}
            </span>
          </div>
          <h2 className="mt-1 truncate font-semibold">{card.title}</h2>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => navigate(`/karten/${card.id}/bearbeiten`)}
        >
          {de.cards.edit}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          busy={busy}
          onClick={() => void changeStatus(paused ? 'active' : 'paused')}
        >
          {paused ? de.cards.resume : de.cards.pause}
        </Button>
        <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
          {de.common.delete}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={de.cards.deleteTitle}
        text={de.cards.deleteText}
        confirmLabel={de.common.delete}
        danger
        busy={busy}
        onConfirm={() => void changeStatus('deleted')}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

export function MyCardsPage() {
  const cards = useCardsStore((s) => s.cards)
  const loaded = useCardsStore((s) => s.loaded)
  const overview = useMatchesStore((s) => s.overview)

  if (!loaded) return <LoadingScreen />

  const matchCounts = new Map<string, number>()
  for (const m of overview) {
    matchCounts.set(m.my_card_id, (matchCounts.get(m.my_card_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{de.cards.title}</h1>
        <Link to="/karten/neu">
          <Button>{de.cards.newCard}</Button>
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-medium">{de.cards.empty}</p>
          <p className="mt-1 text-sm text-zinc-500">{de.cards.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <CardRow key={card.id} card={card} matchCount={matchCounts.get(card.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  )
}
