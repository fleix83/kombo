// Deck distances arrive pre-rounded to 5 km granularity (get_deck RPC),
// so precise localization is impossible by design (PRD §5.4).
export function formatDistanceKm(km: number): string {
  if (km <= 5) return '< 5 km'
  return `ca. ${km} km`
}
