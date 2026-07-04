import { NavLink } from 'react-router-dom'
import { useMatchesStore } from '../../core/store/matchesStore'
import { de } from '../i18n/de'

const iconClass = 'h-6 w-6'

const icons = {
  deck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M3 7v10M21 7v10" strokeLinecap="round" />
    </svg>
  ),
  matches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 20l1-4.1a8.4 8.4 0 1 1 17-4.4Z" strokeLinejoin="round" />
    </svg>
  ),
  cards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
    </svg>
  ),
}

function Tab({
  to,
  label,
  icon,
  badge,
}: {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
          isActive ? 'text-zinc-900 font-medium' : 'text-zinc-400'
        }`
      }
    >
      {icon}
      {label}
      {badge ? (
        <span className="absolute right-1/2 top-1 -mr-6 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

export function BottomNav() {
  const unread = useMatchesStore((s) =>
    s.overview.reduce((sum, m) => sum + m.unread_count, 0),
  )
  return (
    <nav className="sticky bottom-0 flex border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <Tab to="/deck" label={de.nav.deck} icon={icons.deck} />
      <Tab to="/matches" label={de.nav.matches} icon={icons.matches} badge={unread} />
      <Tab to="/karten" label={de.nav.cards} icon={icons.cards} />
      <Tab to="/einstellungen" label={de.nav.settings} icon={icons.settings} />
    </nav>
  )
}
