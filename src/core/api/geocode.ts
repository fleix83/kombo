// Nominatim (OpenStreetMap) geocoding, DACH-scoped (PRD §6.4).
// Usage policy: callers must debounce to ≤ 1 req/s (the city input does).
// Only city-level precision is ever stored: coordinates are rounded to
// 2 decimal places (~1 km) — never raw GPS positions.

export interface GeoResult {
  city: string
  lat: number
  lng: number
  label: string
}

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100
}

const BASE = 'https://nominatim.openstreetmap.org'

interface NominatimItem {
  name?: string
  display_name?: string
  lat: string
  lon: string
  address?: Record<string, string>
}

function cityFromAddress(address: Record<string, string> | undefined, fallback: string): string {
  return address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? fallback
}

export async function geocodeCity(query: string): Promise<GeoResult[]> {
  const url =
    `${BASE}/search?format=jsonv2&limit=5&addressdetails=1&featuretype=settlement` +
    `&countrycodes=de,at,ch&accept-language=de&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`geocoding failed: ${res.status}`)
  const items = (await res.json()) as NominatimItem[]
  return items.map((item) => {
    const name = item.name || item.display_name?.split(',')[0] || query
    return {
      city: cityFromAddress(item.address, name),
      lat: roundCoord(parseFloat(item.lat)),
      lng: roundCoord(parseFloat(item.lon)),
      label: item.display_name ?? name,
    }
  })
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const url =
    `${BASE}/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=de` +
    `&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`reverse geocoding failed: ${res.status}`)
  const item = (await res.json()) as NominatimItem
  if (!item || !item.lat) return null
  const name = cityFromAddress(item.address, item.name ?? '')
  if (!name) return null
  return {
    city: name,
    lat: roundCoord(parseFloat(item.lat)),
    lng: roundCoord(parseFloat(item.lon)),
    label: item.display_name ?? name,
  }
}
