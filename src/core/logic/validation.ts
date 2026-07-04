import { z } from 'zod'
import { MIN_AGE, isAtLeastAge } from './age'

// zod messages are i18n KEYS, not display strings — the UI maps them through
// de.ts (all UI copy lives there, PRD §8). See ui/i18n/de.ts → validation.

export const signupSchema = z.object({
  email: z.string().email('email_invalid'),
  password: z.string().min(8, 'password_min'),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'birth_date_invalid')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'birth_date_invalid')
    .refine((v) => isAtLeastAge(v, MIN_AGE), 'age_min'),
})

export const profileSchema = z.object({
  displayName: z.string().min(2, 'name_length').max(40, 'name_length'),
  city: z.string().min(1, 'city_required'),
  bio: z.string().max(500, 'bio_max').optional().or(z.literal('')),
})

export const cardSchema = z.object({
  type: z.enum(['project', 'collab_offer', 'mentor_offer']),
  title: z.string().min(3, 'title_length').max(80, 'title_length'),
  description: z.string().min(20, 'description_length').max(1000, 'description_length'),
  city: z.string().min(1, 'city_required'),
  radiusKm: z.number().int().min(5, 'radius_range').max(200, 'radius_range'),
  showCollaborators: z.boolean(),
  showMentors: z.boolean(),
})

export const messageSchema = z.object({
  content: z.string().min(1, 'message_length').max(2000, 'message_length'),
})

export const reportSchema = z.object({
  reason: z.string().min(1, 'reason_required').max(1000, 'reason_max'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type ProfileFormInput = z.infer<typeof profileSchema>
export type CardFormInput = z.infer<typeof cardSchema>

// First issue message key per field, e.g. { email: 'email_invalid' }
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
