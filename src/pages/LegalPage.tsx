import { useNavigate } from 'react-router-dom'
import { de } from '../ui/i18n/de'

const titles = {
  privacy: de.legal.privacyTitle,
  terms: de.legal.termsTitle,
  imprint: de.legal.imprintTitle,
} as const

// Static placeholder pages (PRD §2, §10.1) — final legal copy comes from the
// product owner and replaces the placeholder blocks below.
export function LegalPage({ kind }: { kind: keyof typeof titles }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 self-start text-sm text-zinc-500"
      >
        ← {de.common.back}
      </button>
      <h1 className="text-xl font-bold">{titles[kind]}</h1>
      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
        {de.legal.placeholderNote}
      </p>
      <div className="mt-4 space-y-3 text-sm text-zinc-600">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
          ea commodo consequat.
        </p>
      </div>
    </div>
  )
}
