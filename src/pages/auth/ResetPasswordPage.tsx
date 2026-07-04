import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { updatePassword } from '../../core/api/auth'
import { useAuthStore } from '../../core/store/authStore'
import { Button } from '../../ui/components/Button'
import { Field, Input } from '../../ui/components/Field'
import { LoadingScreen } from '../../ui/components/Spinner'
import { de, validationMessage } from '../../ui/i18n/de'
import { authErrorMessage } from '../../ui/lib/errors'

// Target of the recovery link: supabase-js picks the session up from the URL.
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!initialized) return <LoadingScreen />

  if (!session) {
    return (
      <div className="flex flex-1 flex-col justify-center p-6 text-center">
        <p className="text-sm text-zinc-600">{de.auth.resetLinkInvalid}</p>
        <p className="mt-6 text-sm">
          <Link to="/passwort-vergessen" className="underline">
            {de.auth.resetTitle}
          </Link>
        </p>
      </div>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError(validationMessage('password_min'))
      return
    }
    setError('')
    setBusy(true)
    try {
      await updatePassword(password)
      navigate('/deck')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center p-6">
      <h1 className="mb-6 text-xl font-bold">{de.auth.newPasswordTitle}</h1>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={de.auth.newPassword}>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" full busy={busy}>
          {de.auth.setPassword}
        </Button>
      </form>
    </div>
  )
}
