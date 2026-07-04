import type { CardType } from '../types/db'

// Matching matrix (PRD §3.2): project ↔ offer, never project ↔ project,
// never offer ↔ offer. The server (get_deck) is authoritative; these helpers
// exist for UI copy and client-side sanity checks.

export function counterpartTypes(type: CardType): CardType[] {
  return type === 'project' ? ['collab_offer', 'mentor_offer'] : ['project']
}

export function canMatch(a: CardType, b: CardType): boolean {
  return (a === 'project') !== (b === 'project')
}
