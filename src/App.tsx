import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './core/store/authStore'
import { AppShell } from './ui/components/AppShell'
import { LoadingScreen } from './ui/components/Spinner'
import { CardFormPage } from './pages/CardFormPage'
import { ChatPage } from './pages/ChatPage'
import { DeckPage } from './pages/DeckPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LegalPage } from './pages/LegalPage'
import { LoginPage } from './pages/auth/LoginPage'
import { MatchesPage } from './pages/MatchesPage'
import { MyCardsPage } from './pages/MyCardsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { SettingsPage } from './pages/SettingsPage'
import { SignupPage } from './pages/auth/SignupPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'

// Route guards: signed out → /login · unverified → /verify ·
// verified without finished onboarding → /onboarding · else app.
function useAuth() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const initialized = useAuthStore((s) => s.initialized)
  return { session, profile, initialized }
}

function Protected() {
  const { session, profile, initialized } = useAuth()
  if (!initialized) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!session.user.email_confirmed_at) return <Navigate to="/verify" replace />
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function OnboardingGate() {
  const { session, profile, initialized } = useAuth()
  if (!initialized) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!session.user.email_confirmed_at) return <Navigate to="/verify" replace />
  if (profile?.onboarding_complete) return <Navigate to="/deck" replace />
  return <OnboardingPage />
}

function PublicOnly() {
  const { session, initialized } = useAuth()
  if (!initialized) return <LoadingScreen />
  if (session && session.user.email_confirmed_at) return <Navigate to="/deck" replace />
  return <Outlet />
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    void init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
          </Route>

          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/passwort-zuruecksetzen" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingGate />} />

          <Route element={<Protected />}>
            <Route path="/deck" element={<DeckPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/chat/:matchId" element={<ChatPage />} />
            <Route path="/karten" element={<MyCardsPage />} />
            <Route path="/karten/neu" element={<CardFormPage />} />
            <Route path="/karten/:id/bearbeiten" element={<CardFormPage />} />
            <Route path="/einstellungen" element={<SettingsPage />} />
            <Route path="/einstellungen/profil" element={<EditProfilePage />} />
          </Route>

          <Route path="/datenschutz" element={<LegalPage kind="privacy" />} />
          <Route path="/agb" element={<LegalPage kind="terms" />} />
          <Route path="/impressum" element={<LegalPage kind="imprint" />} />

          <Route path="*" element={<Navigate to="/deck" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
