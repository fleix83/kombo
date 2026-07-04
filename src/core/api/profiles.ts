import type { Profile, ProfileInput } from '../types/db'
import { currentUserId } from './auth'
import { supabase } from './supabase'

export async function getOwnProfile(): Promise<Profile | null> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createProfile(input: ProfileInput & { birth_date: string }): Promise<Profile> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('profiles')
    .insert({ id: uid, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(patch: Partial<ProfileInput> & { onboarding_complete?: boolean }): Promise<Profile> {
  const uid = await currentUserId()
  const { data, error } = await supabase()
    .from('profiles')
    .update(patch)
    .eq('id', uid)
    .select()
    .single()
  if (error) throw error
  return data
}

// Match partners are readable via RLS (profiles_select policy)
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
