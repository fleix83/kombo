import { useState } from 'react'
import { formatDistanceKm } from '../../core/logic/distance'
import type { CardType } from '../../core/types/db'
import { de } from '../i18n/de'
import { Doodle } from './Doodle'
import { TypeBadge } from './TypeBadge'

// Structural subset of DeckCard so own cards (no distance) render too.
export interface CardViewData {
  card_type: CardType
  title: string
  description: string
  city: string
  distance_km?: number
  drawing_url: string | null
  owner_name: string
  owner_age: number
  owner_drawing_url?: string | null
}

// Header doodle: user-drawn doodles (storage PNGs) and wide images fill the
// header edge-to-edge. Only the square SVG seed motifs (data URIs) keep
// their centered look — they are icons, not banners.
export function CardHeaderDoodle({
  url,
  fallbackUrl,
}: {
  url: string | null | undefined
  fallbackUrl?: string | null
}) {
  const [wide, setWide] = useState(false)
  if (!url) {
    return (
      <div className="flex h-full items-center justify-center">
        <Doodle url={fallbackUrl} className="h-32 w-32" />
      </div>
    )
  }
  const isSeedIcon = url.startsWith('data:')
  const detect = (img: HTMLImageElement) =>
    setWide(img.naturalWidth > img.naturalHeight * 1.4)
  const fullBleed = wide || !isSeedIcon
  return fullBleed ? (
    <img
      src={url}
      alt=""
      draggable={false}
      className="h-full w-full object-cover"
      onLoad={(e) => detect(e.currentTarget)}
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <img
        src={url}
        alt=""
        draggable={false}
        className="h-32 w-32 object-contain"
        onLoad={(e) => detect(e.currentTarget)}
      />
    </div>
  )
}

// Deck card layout (PRD §5.4): one mobile screen, no page scrolling.
// Description truncates and expands in place (scrolls inside the card).
export function CardView({ card }: { card: CardViewData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="h-44 shrink-0 overflow-hidden border-b border-zinc-100 bg-zinc-50">
        <CardHeaderDoodle url={card.drawing_url} fallbackUrl={card.owner_drawing_url} />
      </div>

      <div className={`flex-1 p-4 ${expanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <TypeBadge type={card.card_type} />
        <h2 className="mt-2 text-lg font-semibold leading-snug">{card.title}</h2>
        <p className={`mt-2 text-sm text-zinc-600 ${expanded ? '' : 'line-clamp-4'}`}>
          {card.description}
        </p>
        {!expanded && card.description.length > 180 && (
          <button
            type="button"
            className="mt-1 text-sm font-medium text-zinc-900 underline"
            onClick={(e) => {
              // don't bubble into tap-to-close containers (card preview)
              e.stopPropagation()
              setExpanded(true)
            }}
          >
            {de.common.more}
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-100 p-4 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">
          {card.owner_name}, {card.owner_age}
        </span>
        {' · '}
        {card.city}
        {card.distance_km !== undefined && (
          <>
            {' · '}
            {formatDistanceKm(card.distance_km)}
          </>
        )}
      </div>
    </div>
  )
}
