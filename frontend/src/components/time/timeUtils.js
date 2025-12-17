export function hourToTime(hour) {
  const h = Number(hour)
  if (h === 24) return '24:00:00'
  return `${String(h).padStart(2, '0')}:00:00`
}

export function timeToHour(t) {
  if (!t) return null
  const s = String(t)
  if (s.startsWith('24:00')) return 24
  return Number(s.slice(0, 2))
}

export function hourLabel(h) {
  return `${String(h).padStart(2, '0')}:00`
}
