import type { ExternalRating, ExternalRatingsBatchItem, MediaSummary } from '../types/publicMedia.types'

export type ExternalRatingSource = 'IMDb' | 'RottenTomatoes' | 'Metacritic' | 'Letterboxd'

export type QualityFilter = 'none' | 'imdb-75' | 'tomatoes-80' | 'metacritic-70' | 'letterboxd-40'

export const externalRatingSortOptions: Array<{ value: ExternalRatingSource; label: string }> = [
  { value: 'IMDb', label: 'IMDb' },
  { value: 'RottenTomatoes', label: 'Rotten Tomatoes' },
  { value: 'Metacritic', label: 'Metacritic' },
  { value: 'Letterboxd', label: 'Letterboxd' },
]

export const qualityFilterOptions: Array<{ value: QualityFilter; label: string; source?: ExternalRatingSource; min?: number }> = [
  { value: 'none', label: 'Sin filtro externo' },
  { value: 'imdb-75', label: 'IMDb 7.5+', source: 'IMDb', min: 7.5 },
  { value: 'tomatoes-80', label: 'Rotten 80%+', source: 'RottenTomatoes', min: 80 },
  { value: 'metacritic-70', label: 'Metacritic 70+', source: 'Metacritic', min: 70 },
  { value: 'letterboxd-40', label: 'Letterboxd 4.0+', source: 'Letterboxd', min: 4 },
]

export function getRatingsKey(mediaType: string, tmdbId: number) {
  return `${mediaType}-${tmdbId}`
}

export function toRatingsMap(items: ExternalRatingsBatchItem[] | undefined) {
  return new Map((items ?? []).map((item) => [getRatingsKey(item.mediaType, item.tmdbId), item.ratings]))
}

export function ratingBySource(ratings: ExternalRating[] | undefined, source: ExternalRatingSource) {
  return ratings?.find((rating) => rating.source === source) ?? null
}

export function ratingValueForSort(ratings: ExternalRating[] | undefined, source: ExternalRatingSource) {
  const rating = ratingBySource(ratings, source)
  return rating ? rating.value / rating.scale : -1
}

export function formatExternalRating(rating: ExternalRating | null) {
  if (!rating) {
    return null
  }

  if (rating.scale === 100) {
    return rating.source === 'Metacritic' ? `${Math.round(rating.value)}/100` : `${Math.round(rating.value)}%`
  }

  const value = rating.value.toLocaleString('es-AR', {
    minimumFractionDigits: rating.value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })

  return `${value}/${Math.round(rating.scale)}`
}

/**
 * Blended 0–10 quality score from IMDb + Rotten Tomatoes only (the two sources the
 * user cares about). Returns null when neither is available so callers can rank
 * externally-rated titles ahead of ones with no IMDb/RT data.
 */
export function externalQualityScore(ratings: ExternalRating[] | undefined): number | null {
  const imdb = normalizeToTen(ratingBySource(ratings, 'IMDb'))
  const tomatoes = normalizeToTen(ratingBySource(ratings, 'RottenTomatoes'))
  const values = [imdb, tomatoes].filter((value): value is number => value !== null)
  return values.length > 0 ? average(values) : null
}

export function filterByQuality(items: MediaSummary[], ratingsMap: Map<string, ExternalRating[]>, filter: QualityFilter) {
  const option = qualityFilterOptions.find((candidate) => candidate.value === filter)
  if (!option?.source || option.min === undefined) {
    return items
  }

  return items.filter((item) => {
    const rating = ratingBySource(ratingsMap.get(getRatingsKey(item.mediaType, item.tmdbId)), option.source!)
    return Boolean(rating && rating.value >= option.min!)
  })
}

export function buildExternalRatingInsight(ratings: ExternalRating[]) {
  const criticValues = [
    normalizeToTen(ratingBySource(ratings, 'Metacritic')),
    normalizeToTen(ratingBySource(ratings, 'RottenTomatoes')),
  ].filter((value): value is number => value !== null)

  const audienceValues = [
    normalizeToTen(ratingBySource(ratings, 'IMDb')),
    normalizeToTen(ratingBySource(ratings, 'Letterboxd')),
  ].filter((value): value is number => value !== null)

  if (criticValues.length === 0 && audienceValues.length === 0) {
    return null
  }

  const critic = average(criticValues)
  const audience = average(audienceValues)

  if (critic !== null && audience !== null) {
    if (critic - audience >= 0.8) {
      return 'La crítica la acompaña más fuerte que la audiencia.'
    }

    if (audience - critic >= 0.8) {
      return 'La audiencia la empuja más que la crítica.'
    }

    if (critic >= 8 && audience >= 8) {
      return 'Muy fuerte tanto en crítica como en audiencia.'
    }
  }

  const strongest = [...ratings].sort((left, right) => right.value / right.scale - left.value / left.scale)[0]
  return strongest ? `Su mejor senal externa viene de ${strongest.label}.` : null
}

export function buildExternalRatingBadges(ratings: ExternalRating[], releaseYear?: number | null) {
  const badges = new Set<string>()
  const imdb = normalizeToTen(ratingBySource(ratings, 'IMDb'))
  const letterboxd = normalizeToTen(ratingBySource(ratings, 'Letterboxd'))
  const metacritic = normalizeToTen(ratingBySource(ratings, 'Metacritic'))
  const tomatoes = normalizeToTen(ratingBySource(ratings, 'RottenTomatoes'))
  const audienceValues = [imdb, letterboxd].filter((value): value is number => value !== null)
  const criticValues = [metacritic, tomatoes].filter((value): value is number => value !== null)
  const audience = average(audienceValues)
  const critic = average(criticValues)
  const strongestValue = Math.max(imdb ?? 0, letterboxd ?? 0, metacritic ?? 0, tomatoes ?? 0)

  if ((imdb ?? 0) >= 8.4) {
    badges.add('Top IMDb')
  }

  if ((metacritic ?? 0) >= 8 || (tomatoes ?? 0) >= 8.5) {
    badges.add('Aclamada')
  }

  if ((imdb ?? 0) >= 8 || (letterboxd ?? 0) >= 8) {
    badges.add('Fuerte en audiencia')
  }

  if (critic !== null && audience !== null && Math.abs(critic - audience) >= 1.2) {
    badges.add('Divisiva')
  }

  if (releaseYear && releaseYear <= 2005 && strongestValue >= 8) {
    badges.add('Clásico moderno')
  }

  return Array.from(badges).slice(0, 4)
}

export function pickQualityGameCandidates(items: MediaSummary[], ratingsMap: Map<string, ExternalRating[]>) {
  const externallyStrong = items.filter((item) => {
    const ratings = ratingsMap.get(getRatingsKey(item.mediaType, item.tmdbId))
    return (
      ratingValueForSort(ratings, 'IMDb') >= 0.75 ||
      ratingValueForSort(ratings, 'Metacritic') >= 0.7 ||
      ratingValueForSort(ratings, 'RottenTomatoes') >= 0.8
    )
  })

  return externallyStrong.length > 0
    ? externallyStrong
    : items.filter((item) => item.posterUrl && (item.voteAverage ?? 0) >= 7)
}

function normalizeToTen(rating: ExternalRating | null) {
  return rating ? (rating.value / rating.scale) * 10 : null
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}
