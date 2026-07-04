import { describe, expect, it } from 'vitest'
import { cardSchema, fieldErrors, signupSchema } from './validation'

function birthDateYearsAgo(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

describe('signupSchema', () => {
  it('accepts a valid 16+ signup', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      birthDate: birthDateYearsAgo(20),
    })
    expect(result.success).toBe(true)
  })

  it('rejects under-16 with age_min key (PRD §2)', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      birthDate: birthDateYearsAgo(15),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(fieldErrors(result.error).birthDate).toBe('age_min')
    }
  })

  it('rejects short passwords', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      birthDate: birthDateYearsAgo(20),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(fieldErrors(result.error).password).toBe('password_min')
    }
  })
})

describe('cardSchema', () => {
  const valid = {
    type: 'project' as const,
    title: 'Kurzfilm über Quartierläden',
    description: 'Wir drehen einen dokumentarischen Kurzfilm über Quartierläden.',
    city: 'Zürich',
    radiusKm: 50,
    showCollaborators: true,
    showMentors: true,
  }

  it('accepts a valid card', () => {
    expect(cardSchema.safeParse(valid).success).toBe(true)
  })

  it('enforces description 20–1000 (PRD §4)', () => {
    expect(cardSchema.safeParse({ ...valid, description: 'zu kurz' }).success).toBe(false)
    expect(cardSchema.safeParse({ ...valid, description: 'x'.repeat(1001) }).success).toBe(false)
  })

  it('enforces radius 5–200', () => {
    expect(cardSchema.safeParse({ ...valid, radiusKm: 4 }).success).toBe(false)
    expect(cardSchema.safeParse({ ...valid, radiusKm: 201 }).success).toBe(false)
    expect(cardSchema.safeParse({ ...valid, radiusKm: 5 }).success).toBe(true)
  })
})
