import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordReset } from '../../core/api/auth'
import { Button } from '../../ui/components/Button'
import { Field, Input } from '../../ui/components/Field'
import { de } from '../../ui/i18n/de'
import { authErrorMessage } from '../../ui/lib/errors'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await sendPasswordReset(email, `${window.location.origin}/passwort-zuruecksetzen`)
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center p-6">
      <h1 className="mb-3 text-xl font-bold">{de.auth.resetTitle}</h1>
      {sent ? (
        <p className="text-sm text-zinc-600">{de.auth.resetSent}</p>
      ) : (
        <>
          <p className="mb-6 text-sm text-zinc-600">{de.auth.resetText}</p>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label={de.auth.email}>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" full busy={busy}>
              {de.auth.resetSend}
            </Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-zinc-500 underline">
          {de.auth.backToLogin}
        </Link>
      </p>
    </div>
  )
}
