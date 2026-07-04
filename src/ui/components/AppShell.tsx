import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import { useCardsStore } from '../../core/store/cardsStore'
import { useMatchesStore } from '../../core/store/matchesStore'
import { useRealtime } from '../hooks/useRealtime'
import { BottomNav } from './BottomNav'

// Mobile-first single column; desktop gets the same app centered at ~420px
// (PRD §6.2).
export function AppShell() {
  const location = useLocation()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const authed = !!session && !!profile?.onboarding_complete

  useRealtime(authed)

  useEffect(() => {
    if (authed) {
      void useCardsStore.getState().load().catch(() => undefined)
      void useMatchesStore.getState().load().catch(() => undefined)
    }
  }, [authed])

  const navRoots = ['/deck', '/matches', '/karten', '/einstellungen']
  const showNav = authed && navRoots.some((p) => location.pathname.startsWith(p))

  return (
    <div className="min-h-dvh bg-zinc-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-white">
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}
