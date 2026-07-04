import { currentUserId } from './auth'
import { supabase } from './supabase'

const BUCKET = 'drawings'
export const MAX_DRAWING_BYTES = 500 * 1024

// Path convention: drawings/{user_id}/{uuid}.png (PRD §4.4)
export async function uploadDrawing(blob: Blob): Promise<string> {
  if (blob.size > MAX_DRAWING_BYTES) throw new Error('drawing exceeds 500 KB')
  const uid = await currentUserId()
  const path = `${uid}/${crypto.randomUUID()}.png`
  const { error } = await supabase().storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/png',
  })
  if (error) throw error
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Removes every drawing of the current user. Must run BEFORE delete_account:
// the storage API delete removes the actual files, a SQL cascade would not.
export async function deleteAllOwnDrawings(): Promise<void> {
  const uid = await currentUserId()
  const { data, error } = await supabase().storage.from(BUCKET).list(uid)
  if (error) throw error
  if (!data || data.length === 0) return
  const paths = data.map((f) => `${uid}/${f.name}`)
  const { error: removeError } = await supabase().storage.from(BUCKET).remove(paths)
  if (removeError) throw removeError
}
