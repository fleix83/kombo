import { Link } from 'react-router-dom'
import { useMatchesStore } from '../core/store/matchesStore'
import type { MatchOverview } from '../core/types/db'
import { Doodle } from '../ui/components/Doodle'
import { LoadingScreen } from '../ui/components/Spinner'
import { de } from '../ui/i18n/de'

function MatchRow({ match }: { match: MatchOverview }) {
  const archived = match.match_status === 'archived'
  return (
    <Link
      to={`/chat/${match.match_id}`}
      className={`flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 ${
        archived ? 'opacity-60' : ''
      }`}
    >
      <div className="rounded-full border border-zinc-200 bg-zinc-50 p-1.5">
        <Doodle
          url={match.other_card_drawing_url ?? match.other_owner_drawing_url}
          className="h-11 w-11"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold">
            {match.other_owner_name} · {match.other_card_title}
          </span>
          {match.unread_count > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
              {match.unread_count > 9 ? '9+' : match.unread_count}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-500">
          {archived
            ? de.matches.archived
            : (match.last_message_content ?? de.matches.newMatch)}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-400">
          {de.matches.asCard} «{match.my_card_title}»
        </p>
      </div>
    </Link>
  )
}

export function MatchesPage() {
  const overview = useMatchesStore((s) => s.overview)
  const loaded = useMatchesStore((s) => s.loaded)

  if (!loaded) return <LoadingScreen />

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="mb-4 text-xl font-bold">{de.matches.title}</h1>

      {overview.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-medium">{de.matches.empty}</p>
          <p className="mt-1 max-w-64 text-sm text-zinc-500">{de.matches.emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {overview.map((match) => (
            <MatchRow key={match.match_id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
