import { describe, expect, it } from 'vitest'
import { calcAge, isAtLeastAge } from './age'

const TODAY = new Date(2026, 6, 4) // 2026-07-04

describe('calcAge', () => {
  it('computes full years', () => {
    expect(calcAge('1990-01-01', TODAY)).toBe(36)
    expect(calcAge('2000-06-15', TODAY)).toBe(26)
  })

  it('handles birthday not yet reached this year', () => {
    expect(calcAge('2010-07-05', TODAY)).toBe(15) // birthday tomorrow
    expect(calcAge('2010-07-04', TODAY)).toBe(16) // birthday today
    expect(calcAge('2010-12-31', TODAY)).toBe(15)
  })

  it('returns NaN for invalid input', () => {
    expect(calcAge('not-a-date', TODAY)).toBeNaN()
    expect(calcAge('', TODAY)).toBeNaN()
  })
})

describe('isAtLeastAge', () => {
  it('accepts exactly 16 on the birthday', () => {
    expect(isAtLeastAge('2010-07-04', 16, TODAY)).toBe(true)
  })

  it('rejects one day under 16', () => {
    expect(isAtLeastAge('2010-07-05', 16, TODAY)).toBe(false)
  })

  it('rejects invalid dates', () => {
    expect(isAtLeastAge('invalid', 16, TODAY)).toBe(false)
  })
})
