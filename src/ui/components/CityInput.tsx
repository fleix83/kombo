import { useEffect, useRef, useState } from 'react'
import { geocodeCity, reverseGeocode, roundCoord, type GeoResult } from '../../core/api/geocode'
import { de } from '../i18n/de'
import { Input } from './Field'
import { Spinner } from './Spinner'

// City picker with Nominatim autocomplete (debounced ≥ 600 ms → within the
// 1 req/s usage policy) and optional browser geolocation. Only city-level,
// 2-decimal coordinates ever leave this component (PRD §6.4).
export function CityInput({
  value,
  onChange,
  allowGeolocation = false,
}: {
  value: GeoResult | null
  onChange: (value: GeoResult | null) => void
  allowGeolocation?: boolean
}) {
  const [text, setText] = useState(value?.city ?? '')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const requestSeq = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  // sync when the selection is set programmatically (e.g. async prefill)
  useEffect(() => {
    if (value) setText(value.city)
  }, [value])

  function handleTextChange(next: string) {
    setText(next)
    onChange(null) // typing invalidates the previous selection
    setError('')
    clearTimeout(timer.current)
    if (next.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    timer.current = setTimeout(async () => {
      const seq = ++requestSeq.current
      setSearching(true)
      try {
        const results = await geocodeCity(next.trim())
        if (seq !== requestSeq.current) return
        setSuggestions(results)
        setOpen(true)
        if (results.length === 0) setError(de.city.noResults)
      } catch {
        if (seq === requestSeq.current) setError(de.city.searchError)
      } finally {
        if (seq === requestSeq.current) setSearching(false)
      }
    }, 600)
  }

  function select(result: GeoResult) {
    onChange(result)
    setText(result.city)
    setSuggestions([])
    setOpen(false)
    setError('')
  }

  function useLocation() {
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(
            roundCoord(position.coords.latitude),
            roundCoord(position.coords.longitude),
          )
          if (result) select(result)
          else setError(de.city.locationError)
        } catch {
          setError(de.city.locationError)
        } finally {
          setLocating(false)
        }
      },
      () => {
        setError(de.city.locationError)
        setLocating(false)
      },
      { timeout: 10000 },
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Input
          value={text}
          placeholder={de.city.placeholder}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {(searching || locating) && <Spinner />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}-${i}`}>
              <button
                type="button"
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
                onClick={() => select(s)}
              >
                <span className="font-medium">{s.city}</span>
                <span className="block truncate text-xs text-zinc-500">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {allowGeolocation && (
        <button
          type="button"
          className="mt-1.5 text-xs text-zinc-500 underline"
          onClick={useLocation}
          disabled={locating}
        >
          {locating ? de.city.locating : de.city.useLocation}
        </button>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
