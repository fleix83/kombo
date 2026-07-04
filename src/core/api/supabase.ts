import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The client is injected from the platform entry point (web: main.tsx) so
// core/ stays free of import.meta.env and other bundler/platform specifics
// (PRD §6.1). A future React Native app calls initSupabase with its own env.
let client: SupabaseClient | null = null

export function initSupabase(url: string, anonKey: string): void {
  client = createClient(url, anonKey)
}

export function supabase(): SupabaseClient {
  if (!client) throw new Error('Supabase client not initialized — call initSupabase() first')
  return client
}
