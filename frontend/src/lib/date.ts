// Utilidades de fecha para el calendario de estrenos. Locale es-AR en todo el proyecto.
// Trabajamos con fechas "civiles" (YYYY-MM-DD) sin husos: las release dates de TMDB son
// fechas de calendario, no instantes.

const LOCALE = 'es-AR'

/** Clave YYYY-MM-DD de una fecha local (sin corrimiento de zona horaria). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parsea 'YYYY-MM-DD' (o ISO recortado) como fecha local a medianoche. */
export function parseDateKey(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = (result.getDay() + 6) % 7 // lunes = 0
  result.setDate(result.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

/** Etiqueta de día del calendario: 'Hoy' / 'Mañana' / 'Ayer' o 'lunes 21 de julio'. */
export function dayLabel(date: Date, today: Date = new Date()): string {
  const diff = Math.round((stripTime(date).getTime() - stripTime(today).getTime()) / 86_400_000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  return capitalize(date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }))
}

/** Rango legible: '21 – 27 de julio' o '21 jul – 3 ago'. */
export function rangeLabel(from: Date, to: Date): string {
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
  if (sameMonth) {
    const month = capitalize(from.toLocaleDateString(LOCALE, { month: 'long' }))
    return `${from.getDate()} – ${to.getDate()} de ${month}`
  }
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${from.toLocaleDateString(LOCALE, opts)} – ${to.toLocaleDateString(LOCALE, opts)}`
}

export function monthLabel(date: Date): string {
  return capitalize(date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }))
}

/** Antigüedad legible: 'hace 5 min' / 'hace 3 h' / 'hace 2 d' / '14 jul'. */
export function timeAgo(iso: string | null): string {
  if (!iso) {
    return ''
  }
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) {
    return ''
  }
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) {
    return 'recién'
  }
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) {
    return `hace ${diffMin} min`
  }
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) {
    return `hace ${diffHr} h`
  }
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) {
    return `hace ${diffDay} d`
  }
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
