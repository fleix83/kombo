import type { CardType } from '../../core/types/db'
import { de } from '../i18n/de'

const styles: Record<CardType, string> = {
  project: 'bg-amber-100 text-amber-900',
  collab_offer: 'bg-sky-100 text-sky-900',
  mentor_offer: 'bg-violet-100 text-violet-900',
}

export function TypeBadge({ type }: { type: CardType }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type]}`}>
      {de.cardTypes[type]}
    </span>
  )
}
