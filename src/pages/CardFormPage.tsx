import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCard, updateCard } from '../core/api/cards'
import type { GeoResult } from '../core/api/geocode'
import { uploadDrawing } from '../core/api/storage'
import { cardSchema, fieldErrors } from '../core/logic/validation'
import { useAuthStore } from '../core/store/authStore'
import { useCardsStore } from '../core/store/cardsStore'
import type { CardType } from '../core/types/db'
import { Button } from '../ui/components/Button'
import { CityInput } from '../ui/components/CityInput'
import { DrawingCanvas, type DrawingCanvasHandle } from '../ui/components/DrawingCanvas'
import { Doodle } from '../ui/components/Doodle'
import { Field, Input, TextArea } from '../ui/components/Field'
import { RadiusSlider } from '../ui/components/RadiusSlider'
import { de } from '../ui/i18n/de'

const typeOptions: { type: CardType; explainer: string }[] = [
  { type: 'project', explainer: de.cardTypes.projectExplainer },
  { type: 'collab_offer', explainer: de.cardTypes.collabExplainer },
  { type: 'mentor_offer', explainer: de.cardTypes.mentorExplainer },
]

export function CardFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const profile = useAuthStore((s) => s.profile)
  const cards = useCardsStore((s) => s.cards)
  const existing = id ? cards.find((c) => c.id === id) : undefined
  const isEdit = !!id

  const [type, setType] = useState<CardType>('project')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState<GeoResult | null>(null)
  const [radiusKm, setRadiusKm] = useState(50)
  const [showCollaborators, setShowCollaborators] = useState(true)
  const [showMentors, setShowMentors] = useState(true)
  const [redraw, setRedraw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  // prefill: edit → card values; create → profile city (PRD §5.3)
  useEffect(() => {
    if (existing) {
      setType(existing.type)
      setTitle(existing.title)
      setDescription(existing.description)
      setCity({ city: existing.city, lat: existing.lat, lng: existing.lng, label: existing.city })
      setRadiusKm(existing.radius_km)
      setShowCollaborators(existing.show_collaborators)
      setShowMentors(existing.show_mentors)
    } else if (profile) {
      setCity({ city: profile.city, lat: profile.lat, lng: profile.lng, label: profile.city })
      setRadiusKm(profile.radius_km)
    }
  }, [existing, profile])

  if (isEdit && !existing) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500">
        {de.common.error}
      </div>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const parsed = cardSchema.safeParse({
      type,
      title,
      description,
      city: city?.city ?? '',
      radiusKm,
      showCollaborators,
      showMentors,
    })
    if (!parsed.success || !city) {
      const fe = parsed.success ? {} : fieldErrors(parsed.error)
      if (!city) fe.city = 'city_required'
      setErrors(fe)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      let drawingUrl: string | null | undefined
      if (!isEdit || redraw) {
        const blob = await canvasRef.current?.exportPng()
        if (blob) drawingUrl = await uploadDrawing(blob)
      }
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        radius_km: radiusKm,
        show_collaborators: showCollaborators,
        show_mentors: showMentors,
        ...(drawingUrl !== undefined ? { drawing_url: drawingUrl } : {}),
      }
      const saved = existing
        ? await updateCard(existing.id, payload)
        : await createCard(payload)
      useCardsStore.getState().upsertLocal(saved)
      navigate('/karten')
    } catch {
      setSubmitError(de.common.error)
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
        <h1 className="text-xl font-bold">
          {isEdit ? de.cardForm.editTitle : de.cardForm.createTitle}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 pb-8" noValidate>
        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">{de.cardForm.type}</span>
          <div className="space-y-2">
            {typeOptions.map((option) => (
              <label
                key={option.type}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                  type === option.type ? 'border-zinc-900' : 'border-zinc-200'
                } ${isEdit ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="card-type"
                  className="mt-0.5 accent-zinc-900"
                  checked={type === option.type}
                  disabled={isEdit}
                  onChange={() => setType(option.type)}
                />
                <span>
                  <span className="block text-sm font-medium">{de.cardTypes[option.type]}</span>
                  <span className="block text-xs text-zinc-500">{option.explainer}</span>
                </span>
              </label>
            ))}
          </div>
          {isEdit && <p className="mt-1 text-xs text-zinc-500">{de.cardForm.typeLocked}</p>}
        </div>

        <Field label={de.cardForm.cardTitle} error={errors.title}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={de.cardForm.titlePlaceholder}
            maxLength={80}
          />
        </Field>

        <Field label={de.cardForm.description} error={errors.description}>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={de.cardForm.descriptionPlaceholder}
            maxLength={1000}
            rows={5}
          />
          <span className="mt-1 block text-right text-xs text-zinc-400">
            {description.length}/1000
          </span>
        </Field>

        <Field label={de.cardForm.city} error={errors.city}>
          <CityInput value={city} onChange={setCity} />
        </Field>

        <RadiusSlider value={radiusKm} onChange={setRadiusKm} />

        {type === 'project' && (
          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              {de.cardForm.visibility}
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-zinc-900"
                  checked={showCollaborators}
                  onChange={(e) => setShowCollaborators(e.target.checked)}
                />
                {de.cardForm.showCollaborators}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-zinc-900"
                  checked={showMentors}
                  onChange={(e) => setShowMentors(e.target.checked)}
                />
                {de.cardForm.showMentors}
              </label>
            </div>
          </div>
        )}

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            {de.cardForm.drawingTitle}
          </span>
          {isEdit && existing?.drawing_url && !redraw ? (
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-3">
              <Doodle url={existing.drawing_url} className="h-16 w-24" />
              <Button variant="secondary" onClick={() => setRedraw(true)} type="button">
                {de.cardForm.drawingRedraw}
              </Button>
            </div>
          ) : (
            // wide canvas → new card doodles fill the deck-card header
            <DrawingCanvas ref={canvasRef} aspect={2.4} />
          )}
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" full busy={busy}>
          {isEdit ? de.common.save : de.cardForm.create}
        </Button>
      </form>
    </div>
  )
}
