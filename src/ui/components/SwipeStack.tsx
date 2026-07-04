import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { DeckCard, SwipeDirection } from '../../core/types/db'
import { de } from '../i18n/de'
import { CardView } from './CardView'

const SWIPE_DISTANCE = 100
const SWIPE_VELOCITY = 500

// Drag gesture plus explicit buttons for accessibility (PRD §5.4).
export function SwipeStack({
  cards,
  onSwipe,
}: {
  cards: DeckCard[]
  onSwipe: (direction: SwipeDirection) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-12, 12])
  const likeOpacity = useTransform(x, [30, 110], [0, 1])
  const passOpacity = useTransform(x, [-110, -30], [1, 0])

  const top = cards[0]
  if (!top) return null

  async function fly(direction: SwipeDirection) {
    // AnimationPlaybackControls is thenable — awaiting waits for completion
    await animate(x, direction === 'like' ? 500 : -500, {
      duration: 0.2,
      ease: 'easeIn',
    })
    onSwipe(direction)
    x.set(0)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1">
        {cards[2] && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94]">
            <CardView card={cards[2]} />
          </div>
        )}
        {cards[1] && (
          <div className="absolute inset-0 translate-y-1.5 scale-[0.97]">
            <CardView card={cards[1]} />
          </div>
        )}
        <motion.div
          key={top.card_id}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={(_e, info) => {
            if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) {
              void fly('like')
            } else if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
              void fly('pass')
            }
          }}
        >
          <CardView card={top} />
          <motion.span
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-4 top-4 rounded-lg border-2 border-green-600 px-2 py-1 text-sm font-bold uppercase text-green-600"
          >
            {de.deck.like}
          </motion.span>
          <motion.span
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-4 top-4 rounded-lg border-2 border-zinc-400 px-2 py-1 text-sm font-bold uppercase text-zinc-400"
          >
            {de.deck.pass}
          </motion.span>
        </motion.div>
      </div>

      <div className="flex justify-center gap-6 py-4">
        <button
          type="button"
          aria-label={de.deck.pass}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition-colors hover:bg-zinc-50"
          onClick={() => void fly('pass')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={de.deck.like}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700"
          onClick={() => void fly('like')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
            <path d="M12 21s-7.5-4.7-9.7-9C.8 8.9 2.4 5.5 5.6 5c1.9-.3 3.8.6 4.9 2.2h3c1.1-1.6 3-2.5 4.9-2.2 3.2.5 4.8 3.9 3.3 7-2.2 4.3-9.7 9-9.7 9Z" transform="scale(0.92) translate(1,0)" />
          </svg>
        </button>
      </div>
    </div>
  )
}
