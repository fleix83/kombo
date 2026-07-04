import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../core/api/auth'
import { fieldErrors, signupSchema } from '../../core/logic/validation'
import { Button } from '../../ui/components/Button'
import { Field, Input } from '../../ui/components/Field'
import { de } from '../../ui/i18n/de'
import { authErrorMessage } from '../../ui/lib/errors'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const parsed = signupSchema.safeParse({ email, password, birthDate })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const { needsVerification } = await signUp(
        email,
        password,
        birthDate,
        window.location.origin,
      )
      navigate(needsVerification ? '/verify' : '/deck')
    } catch (error) {
      setSubmitError(authErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center p-6">
      <h1 className="mb-1 text-2xl font-bold">{de.common.appName}</h1>
      <p className="mb-6 text-sm text-zinc-500">{de.auth.signupTitle}</p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={de.auth.email} error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={de.auth.password} error={errors.password}>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label={de.auth.birthDate} error={errors.birthDate} hint={de.auth.birthDateHint}>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Field>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" full busy={busy}>
          {de.auth.signup}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {de.auth.haveAccount}{' '}
        <Link to="/login" className="font-medium text-zinc-900 underline">
          {de.auth.login}
        </Link>
      </p>
    </div>
  )
}
