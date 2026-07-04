import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GeoResult } from '../core/api/geocode'
import { updateProfile } from '../core/api/profiles'
import { uploadDrawing } from '../core/api/storage'
import { fieldErrors, profileSchema } from '../core/logic/validation'
import { useAuthStore } from '../core/store/authStore'
import { Button } from '../ui/components/Button'
import { CityInput } from '../ui/components/CityInput'
import { DrawingCanvas, type DrawingCanvasHandle } from '../ui/components/DrawingCanvas'
import { Doodle } from '../ui/components/Doodle'
import { Field, Input, TextArea } from '../ui/components/Field'
import { RadiusSlider } from '../ui/components/RadiusSlider'
import { de } from '../ui/i18n/de'

export function EditProfilePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState<GeoResult | null>(null)
  const [radiusKm, setRadiusKm] = useState(50)
  const [bio, setBio] = useState('')
  const [redraw, setRedraw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
      setCity({ city: profile.city, lat: profile.lat, lng: profile.lng, label: profile.city })
      setRadiusKm(profile.radius_km)
      setBio(profile.bio ?? '')
    }
  }, [profile])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setInfo('')
    setError('')
    const parsed = profileSchema.safeParse({ displayName, city: city?.city ?? '', bio })
    if (!parsed.success || !city) {
      const fe = parsed.success ? {} : fieldErrors(parsed.error)
      if (!city) fe.city = 'city_required'
      setErrors(fe)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      let drawingUrl: string | undefined
      if (redraw) {
        const blob = await canvasRef.current?.exportPng()
        if (blob) drawingUrl = await uploadDrawing(blob)
      }
      const updated = await updateProfile({
        display_name: displayName.trim(),
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        radius_km: radiusKm,
        bio: bio.trim() || null,
        ...(drawingUrl ? { drawing_url: drawingUrl } : {}),
      })
      setProfile(updated)
      setInfo(de.settings.profileSaved)
      setRedraw(false)
    } catch {
      setError(de.common.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-zinc-500">
          ← {de.common.back}
        </button>
        <h1 className="text-xl font-bold">{de.settings.editProfile}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pb-8" noValidate>
        <Field label={de.onboarding.displayName} error={errors.displayName}>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label={de.onboarding.city} error={errors.city}>
          <CityInput value={city} onChange={setCity} allowGeolocation />
        </Field>
        <RadiusSlider value={radiusKm} onChange={setRadiusKm} hint={de.onboarding.radiusHint} />
        <Field label={de.onboarding.bio} error={errors.bio}>
          <TextArea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </Field>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            {de.settings.myDoodle}
          </span>
          {!redraw ? (
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-3">
              <Doodle url={profile?.drawing_url} className="h-16 w-16" />
              <Button variant="secondary" type="button" onClick={() => setRedraw(true)}>
                {de.cardForm.drawingRedraw}
              </Button>
            </div>
          ) : (
            <DrawingCanvas ref={canvasRef} />
          )}
        </div>

        {info && <p className="text-sm text-green-700">{info}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" full busy={busy}>
          {de.common.save}
        </Button>
      </form>
    </div>
  )
}
