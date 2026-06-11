const tmdbLabelMap = new Map<string, string>([
  ['Action', 'Acción'],
  ['Adventure', 'Aventura'],
  ['Animation', 'Animación'],
  ['Comedy', 'Comedia'],
  ['Crime', 'Crimen'],
  ['Documentary', 'Documental'],
  ['Drama', 'Drama'],
  ['Family', 'Familia'],
  ['Fantasy', 'Fantasía'],
  ['History', 'Historia'],
  ['Horror', 'Terror'],
  ['Music', 'Música'],
  ['Mystery', 'Misterio'],
  ['Romance', 'Romance'],
  ['Science Fiction', 'Ciencia ficción'],
  ['TV Movie', 'Película de TV'],
  ['Thriller', 'Thriller'],
  ['War', 'Bélica'],
  ['Western', 'Western'],
  ['Action & Adventure', 'Acción y aventura'],
  ['Sci-Fi & Fantasy', 'Ciencia ficción y fantasía'],
  ['Kids', 'Infantil'],
  ['News', 'Noticias'],
  ['Reality', 'Reality'],
  ['Soap', 'Telenovela'],
  ['Talk', 'Talk show'],
  ['War & Politics', 'Bélica y política'],
  ['Ended', 'Finalizada'],
  ['Returning Series', 'En emisión'],
  ['Canceled', 'Cancelada'],
  ['Cancelled', 'Cancelada'],
  ['In Production', 'En producción'],
  ['Pilot', 'Piloto'],
  ['Planned', 'Planeada'],
  ['Post Production', 'En posproducción'],
  ['Released', 'Estrenada'],
  ['Rumored', 'Rumoreada'],
  ['Poster', 'Póster'],
  ['Backdrop', 'Fondo'],
  ['Logo', 'Logo'],
])

const countryOverrides = new Map<string, string>([
  ['US', 'Estados Unidos'],
  ['GB', 'Reino Unido'],
  ['AR', 'Argentina'],
  ['ES', 'España'],
  ['MX', 'México'],
  ['BR', 'Brasil'],
  ['CL', 'Chile'],
  ['CO', 'Colombia'],
  ['FR', 'Francia'],
  ['DE', 'Alemania'],
  ['IT', 'Italia'],
  ['JP', 'Japón'],
  ['KR', 'Corea del Sur'],
  ['CN', 'China'],
  ['CA', 'Canadá'],
  ['AU', 'Australia'],
])

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['es'], { type: 'region' })
  : null

export function translateTmdbLabel(value: string | null | undefined) {
  if (!value) return ''
  return tmdbLabelMap.get(value) ?? value
}

export function translateTmdbLabels(values: string[]) {
  return values.map(translateTmdbLabel).filter(Boolean)
}

export function translateSeriesStatus(value: string | null | undefined) {
  return translateTmdbLabel(value)
}

export function formatCountryName(code: string | null | undefined) {
  const normalized = code?.trim().toUpperCase()
  if (!normalized) return ''
  const override = countryOverrides.get(normalized)
  if (override) return override
  try {
    return regionNames?.of(normalized) ?? normalized
  } catch {
    return normalized
  }
}

export function getEntityInitials(value: string) {
  const words = value
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')
  return initials || 'TM'
}
