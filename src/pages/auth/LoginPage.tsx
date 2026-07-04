import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../core/api/auth'
import { Button } from '../../ui/components/Button'
import { Field, Input } from '../../ui/components/Field'
import { de } from '../../ui/i18n/de'
import { authErrorMessage } from '../../ui/lib/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
      navigate('/deck')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center p-6">
      <h1 className="mb-1 text-2xl font-bold">{de.common.appName}</h1>
      <p className="mb-6 text-sm text-zinc-500">{de.auth.loginTitle}</p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={de.auth.email}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={de.auth.password}>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" full busy={busy}>
          {de.auth.login}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-zinc-500">
        <p>
          <Link to="/passwort-vergessen" className="underline">
            {de.auth.forgotPassword}
          </Link>
        </p>
        <p>
          {de.auth.noAccount}{' '}
          <Link to="/signup" className="font-medium text-zinc-900 underline">
            {de.auth.signup}
          </Link>
        </p>
      </div>
    </div>
  )
}
