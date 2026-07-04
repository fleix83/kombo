// Neutral placeholder doodle (PRD §5.2) shown when a user skipped drawing.
const placeholder = (
  <svg viewBox="0 0 100 100" className="h-full w-full text-zinc-300" aria-hidden>
    <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 7" />
    <circle cx="40" cy="44" r="3.5" fill="currentColor" />
    <circle cx="60" cy="44" r="3.5" fill="currentColor" />
    <path d="M38 60 Q50 70 62 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
)

export function Doodle({
  url,
  alt = '',
  className = 'h-16 w-16',
  fit = 'contain',
}: {
  url: string | null | undefined
  alt?: string
  className?: string
  fit?: 'contain' | 'cover'
}) {
  return (
    <div className={`shrink-0 overflow-hidden ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          draggable={false}
        />
      ) : (
        placeholder
      )}
    </div>
  )
}
