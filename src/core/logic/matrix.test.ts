import { describe, expect, it } from 'vitest'
import { canMatch, counterpartTypes } from './matrix'

describe('matching matrix (PRD §3.2)', () => {
  it('projects see both offer types', () => {
    expect(counterpartTypes('project')).toEqual(['collab_offer', 'mentor_offer'])
  })

  it('offers see only projects', () => {
    expect(counterpartTypes('collab_offer')).toEqual(['project'])
    expect(counterpartTypes('mentor_offer')).toEqual(['project'])
  })

  it('project ↔ project is a hard exclusion', () => {
    expect(canMatch('project', 'project')).toBe(false)
  })

  it('offer ↔ offer never matches', () => {
    expect(canMatch('collab_offer', 'mentor_offer')).toBe(false)
    expect(canMatch('collab_offer', 'collab_offer')).toBe(false)
  })

  it('project ↔ offer matches', () => {
    expect(canMatch('project', 'collab_offer')).toBe(true)
    expect(canMatch('mentor_offer', 'project')).toBe(true)
  })
})
