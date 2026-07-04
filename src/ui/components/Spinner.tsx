import { de } from '../i18n/de'

export function Spinner() {
  return (
    <div
      className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"
      role="status"
      aria-label={de.common.loading}
    />
  )
}

export function LoadingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner />
    </div>
  )
}
