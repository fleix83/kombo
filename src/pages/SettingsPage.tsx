import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAccount } from '../core/api/account'
import { signOut, updateEmail, updatePassword } from '../core/api/auth'
import { useAuthStore } from '../core/store/authStore'
import { Button } from '../ui/components/Button'
import { ConfirmDialog } from '../ui/components/ConfirmDialog'
import { Doodle } from '../ui/components/Doodle'
import { Field, Input } from '../ui/components/Field'
import { de, validationMessage } from '../ui/i18n/de'
import { authErrorMessage } from '../ui/lib/errors'

export function SettingsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)

  const [newEmail, setNewEmail] = useState('')
  const [emailInfo, setEmailInfo] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordInfo, setPasswordInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // double confirmation for account deletion (PRD §5.8)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)

  async function onChangeEmail(e: FormEvent) {
    e.preventDefault()
    setError('')
    setEmailInfo('')
    setBusy(true)
    try {
      await updateEmail(newEmail)
      setEmailInfo(de.settings.emailChangeSent)
      setNewEmail('')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault()
    setError('')
    setPasswordInfo('')
    if (newPassword.length < 8) {
      setError(validationMessage('password_min'))
      return
    }
    setBusy(true)
    try {
      await updatePassword(newPassword)
      setPasswordInfo(de.settings.passwordChanged)
      setNewPassword('')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    setBusy(true)
    try {
      await deleteAccount()
      navigate('/login')
    } catch {
      setError(de.common.error)
      setBusy(false)
      setDeleteStep(0)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pb-8">
      <div className="flex items-center gap-4">
        <div className="rounded-full border border-zinc-200 bg-zinc-50 p-2">
          <Doodle url={profile?.drawing_url} className="h-14 w-14" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{profile?.display_name}</h1>
          <p className="truncate text-sm text-zinc-500">
            {profile?.city} · {session?.user.email}
          </p>
        </div>
      </div>

      <Link to="/einstellungen/profil">
        <Button variant="secondary" full>
          {de.settings.editProfile}
        </Button>
      </Link>

      <form onSubmit={onChangeEmail} className="space-y-2">
        <Field label={de.settings.changeEmail} hint={emailInfo || undefined}>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={de.settings.newEmail}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={!newEmail} busy={busy}>
          {de.common.save}
        </Button>
      </form>

      <form onSubmit={onChangePassword} className="space-y-2">
        <Field label={de.settings.changePassword} hint={passwordInfo || undefined}>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={de.auth.newPassword}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={!newPassword} busy={busy}>
          {de.common.save}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-700">{de.settings.legal}</h2>
        <div className="space-y-1 text-sm">
          <Link to="/datenschutz" className="block text-zinc-600 underline">
            {de.settings.privacy}
          </Link>
          <Link to="/agb" className="block text-zinc-600 underline">
            {de.settings.terms}
          </Link>
          <Link to="/impressum" className="block text-zinc-600 underline">
            {de.settings.imprint}
          </Link>
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-zinc-100 pt-6">
        <Button
          variant="secondary"
          full
          onClick={() => {
            void signOut()
              .catch(() => undefined)
              .then(() => navigate('/login'))
          }}
        >
          {de.auth.logout}
        </Button>
        <Button variant="ghost" full className="text-red-600" onClick={() => setDeleteStep(1)}>
          {de.settings.deleteAccount}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteStep === 1}
        title={de.settings.deleteTitle1}
        text={de.settings.deleteText1}
        confirmLabel={de.common.next}
        danger
        onConfirm={() => setDeleteStep(2)}
        onCancel={() => setDeleteStep(0)}
      />
      <ConfirmDialog
        open={deleteStep === 2}
        title={de.settings.deleteTitle2}
        text={de.settings.deleteText2}
        confirmLabel={de.settings.deleteConfirm}
        danger
        busy={busy}
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteStep(0)}
      />
    </div>
  )
}
