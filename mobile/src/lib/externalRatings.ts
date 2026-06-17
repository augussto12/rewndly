import type { ExternalRating } from '../api/types'

export function ratingBySource(ratings: ExternalRating[] | undefined, source: string) {
  return ratings?.find((rating) => rating.source === source) ?? null
}

export function pickCriticRating(ratings: ExternalRating[] | undefined) {
  return ratingBySource(ratings, 'Metacritic') ?? ratingBySource(ratings, 'RottenTomatoes')
}

export function formatExternalRating(rating: ExternalRating | null) {
  if (!rating) {
    return null
  }

  if (rating.scale === 100) {
    return rating.source === 'Metacritic' ? `${Math.round(rating.value)}/100` : `${Math.round(rating.value)}%`
  }

  const value = rating.value % 1 === 0 ? String(rating.value) : rating.value.toFixed(1)
  return `${value}/${Math.round(rating.scale)}`
}
