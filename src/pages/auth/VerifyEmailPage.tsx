import { Navigate, useNavigate } from 'react-router-dom'
import { signOut } from '../../core/api/auth'
import { useAuthStore } from '../../core/store/authStore'
import { Button } from '../../ui/components/Button'
import { LoadingScreen } from '../../ui/components/Spinner'
import { de } from '../../ui/i18n/de'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)

  if (!initialized) return <LoadingScreen />
  if (session?.user.email_confirmed_at) return <Navigate to="/deck" replace />

  return (
    <div className="flex flex-1 flex-col justify-center p-6 text-center">
      <h1 className="mb-3 text-xl font-bold">{de.auth.verifyTitle}</h1>
      <p className="text-sm text-zinc-600">{de.auth.verifyText}</p>
      {session?.user.email && (
        <p className="mt-2 text-sm font-medium text-zinc-900">{session.user.email}</p>
      )}
      <p className="mt-4 text-xs text-zinc-500">{de.auth.verifyResendHint}</p>
      <div className="mt-8">
        <Button
          variant="secondary"
          full
          onClick={() => {
            void signOut()
              .catch(() => undefined)
              .then(() => navigate('/login'))
          }}
        >
          {de.auth.backToLogin}
        </Button>
      </div>
    </div>
  )
}
