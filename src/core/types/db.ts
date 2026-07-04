// Mirrors supabase/migrations/0001_schema.sql — keep in sync.

export type CardType = 'project' | 'collab_offer' | 'mentor_offer'
export type CardStatus = 'active' | 'paused' | 'deleted'
export type SwipeDirection = 'like' | 'pass'
export type MatchStatus = 'active' | 'archived'
export type ReportStatus = 'open' | 'resolved'

export interface Profile {
  id: string
  display_name: string
  birth_date: string
  bio: string | null
  city: string
  lat: number
  lng: number
  drawing_url: string | null
  radius_km: number
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  owner_id: string
  type: CardType
  title: string
  description: string
  city: string
  lat: number
  lng: number
  radius_km: number
  drawing_url: string | null
  show_collaborators: boolean
  show_mentors: boolean
  status: CardStatus
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  card_a_id: string
  card_b_id: string
  status: MatchStatus
  created_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

// Row shape of the get_deck RPC (0003_functions.sql)
export interface DeckCard {
  card_id: string
  card_type: CardType
  title: string
  description: string
  city: string
  distance_km: number
  drawing_url: string | null
  owner_id: string
  owner_name: string
  owner_age: number
  owner_drawing_url: string | null
}

// Row shape of the get_matches_overview RPC (0003_functions.sql)
export interface MatchOverview {
  match_id: string
  match_status: MatchStatus
  match_created_at: string
  my_card_id: string
  my_card_title: string
  other_card_id: string
  other_card_title: string
  other_card_type: CardType
  other_card_drawing_url: string | null
  other_owner_id: string
  other_owner_name: string
  other_owner_drawing_url: string | null
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}

export interface CardInput {
  type: CardType
  title: string
  description: string
  city: string
  lat: number
  lng: number
  radius_km: number
  drawing_url?: string | null
  show_collaborators?: boolean
  show_mentors?: boolean
}

export interface ProfileInput {
  display_name: string
  city: string
  lat: number
  lng: number
  bio?: string | null
  drawing_url?: string | null
  radius_km?: number
}
