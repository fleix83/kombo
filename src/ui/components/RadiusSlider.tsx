import { de } from '../i18n/de'

export function RadiusSlider({
  value,
  onChange,
  hint,
}: {
  value: number
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {de.cardForm.radius}: {value} km
      </span>
      <input
        type="range"
        min={5}
        max={200}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-zinc-900"
      />
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </div>
  )
}
