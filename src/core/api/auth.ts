import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface SignUpResult {
  needsVerification: boolean
}

// Date of birth is stored in auth metadata at signup and copied into
// profiles.birth_date when the profile row is created during onboarding
// (profiles has NOT NULL columns that don't exist before onboarding).
export async function signUp(
  email: string,
  password: string,
  birthDate: string,
  emailRedirectTo?: string,
): Promise<SignUpResult> {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: { data: { birth_date: birthDate }, emailRedirectTo },
  })
  if (error) throw error
  return { needsVerification: !data.session }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase().auth.signOut()
  if (error) throw error
}

export async function sendPasswordReset(email: string, redirectTo: string): Promise<void> {
  const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase().auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateEmail(newEmail: string): Promise<void> {
  const { error } = await supabase().auth.updateUser({ email: newEmail })
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase().auth.getSession()
  if (error) throw error
  return data.session
}

export async function currentUserId(): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('not authenticated')
  return session.user.id
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase().auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export function birthDateFromMetadata(session: Session): string | null {
  const value = session.user.user_metadata?.birth_date
  return typeof value === 'string' ? value : null
}
