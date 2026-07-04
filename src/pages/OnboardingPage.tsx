import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { birthDateFromMetadata } from '../core/api/auth'
import type { GeoResult } from '../core/api/geocode'
import { createProfile, updateProfile } from '../core/api/profiles'
import { uploadDrawing } from '../core/api/storage'
import { fieldErrors, profileSchema } from '../core/logic/validation'
import { useAuthStore } from '../core/store/authStore'
import { Button } from '../ui/components/Button'
import { CityInput } from '../ui/components/CityInput'
import { DrawingCanvas, type DrawingCanvasHandle } from '../ui/components/DrawingCanvas'
import { Field, Input, TextArea } from '../ui/components/Field'
import { de } from '../ui/i18n/de'

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [step, setStep] = useState<1 | 2 | 3>(profile ? 2 : 1)
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState<GeoResult | null>(null)
  const [bio, setBio] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  async function submitStep1(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const parsed = profileSchema.safeParse({ displayName, city: city?.city ?? '', bio })
    if (!parsed.success || !city) {
      const fe = parsed.success ? {} : fieldErrors(parsed.error)
      if (!city) fe.city = 'city_required'
      setErrors(fe)
      return
    }
    setErrors({})
    const birthDate = session ? birthDateFromMetadata(session) : null
    if (!birthDate) {
      setSubmitError(de.common.error)
      return
    }
    setBusy(true)
    try {
      const created = await createProfile({
        display_name: displayName.trim(),
        birth_date: birthDate,
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        bio: bio.trim() || null,
      })
      setProfile(created)
      setStep(2)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setSubmitError(message.includes('min_age') ? de.validation.age_min : de.common.error)
    } finally {
      setBusy(false)
    }
  }

  async function submitStep2(skip: boolean) {
    setSubmitError('')
    if (skip) {
      setStep(3)
      return
    }
    setBusy(true)
    try {
      const blob = await canvasRef.current?.exportPng()
      if (blob) {
        const url = await uploadDrawing(blob)
        const updated = await updateProfile({ drawing_url: url })
        setProfile(updated)
      }
      setStep(3)
    } catch {
      setSubmitError(de.drawing.uploadFailed)
    } finally {
      setBusy(false)
    }
  }

  async function finish(createCard: boolean) {
    setBusy(true)
    try {
      const updated = await updateProfile({ onboarding_complete: true })
      setProfile(updated)
      // defer past the OnboardingGate redirect that fires on the profile update
      setTimeout(() => navigate(createCard ? '/karten/neu' : '/deck'), 0)
    } catch {
      setSubmitError(de.common.error)
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <p className="mb-6 text-xs font-medium text-zinc-400">Schritt {step} / 3</p>

      {step === 1 && (
        <form onSubmit={submitStep1} className="space-y-4" noValidate>
          <div>
            <h1 className="text-xl font-bold">{de.onboarding.step1Title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{de.onboarding.step1Text}</p>
          </div>
          <Field label={de.onboarding.displayName} error={errors.displayName}>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label={de.onboarding.city} error={errors.city}>
            <CityInput value={city} onChange={setCity} allowGeolocation />
          </Field>
          <Field label={de.onboarding.bio} error={errors.bio}>
            <TextArea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={de.onboarding.bioPlaceholder}
              maxLength={500}
            />
          </Field>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button type="submit" full busy={busy}>
            {de.common.next}
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold">{de.onboarding.step2Title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{de.onboarding.step2Text}</p>
          </div>
          <DrawingCanvas ref={canvasRef} />
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" full onClick={() => void submitStep2(true)} disabled={busy}>
              {de.common.skip}
            </Button>
            <Button full onClick={() => void submitStep2(false)} busy={busy}>
              {de.common.next}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col justify-center space-y-4 text-center">
          <h1 className="text-xl font-bold">{de.onboarding.step3Title}</h1>
          <p className="text-sm text-zinc-600">{de.onboarding.step3Text}</p>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button full onClick={() => void finish(true)} busy={busy}>
            {de.onboarding.createFirstCard}
          </Button>
          <Button variant="secondary" full onClick={() => void finish(false)} disabled={busy}>
            {de.onboarding.later}
          </Button>
        </div>
      )}
    </div>
  )
}
