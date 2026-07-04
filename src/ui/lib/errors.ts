import { de } from '../i18n/de'

// Maps Supabase auth error signals to German copy; everything else falls
// back to the generic error message.
export function authErrorMessage(error: unknown): string {
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : ''
  const message = raw.toLowerCase()
  if (message.includes('email address') && message.includes('invalid'))
    return de.validation.email_invalid
  if (message.includes('invalid login credentials')) return de.authErrors.invalidCredentials
  if (message.includes('already registered') || message.includes('already exists'))
    return de.authErrors.userExists
  if (message.includes('rate limit')) return de.authErrors.rateLimit
  if (message.includes('email not confirmed')) return de.authErrors.emailNotConfirmed
  return de.common.error
}
