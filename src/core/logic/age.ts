export const MIN_AGE = 16

// birthDateIso: 'YYYY-MM-DD'. Parsed by components to stay timezone-safe.
export function calcAge(birthDateIso: string, today: Date = new Date()): number {
  const [year, month, day] = birthDateIso.split('-').map(Number)
  if (!year || !month || !day) return NaN
  let age = today.getFullYear() - year
  const monthDiff = today.getMonth() + 1 - month
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age -= 1
  return age
}

export function isAtLeastAge(birthDateIso: string, minAge: number, today: Date = new Date()): boolean {
  const age = calcAge(birthDateIso, today)
  return Number.isFinite(age) && age >= minAge
}
