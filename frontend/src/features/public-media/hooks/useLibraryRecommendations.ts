import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useMyLibrary } from '../../user-content/hooks/useUserContent'
import type { LibraryItem } from '../../user-content/types/userContent.types'
import { getMovieDetails } from '../services/publicMediaApi'
import type { ExternalRating, MediaSummary, MovieDetails } from '../types/publicMedia.types'
import { externalQualityScore, getRatingsKey } from '../utils/externalRatings'
import { useExternalRatingsPool } from './useExternalRatingsPool'

const SEED_LIMIT = 6
const POOL_SIZE = 24
const RESULT_LIMIT = 18

type TasteEntry = { item: MediaSummary; tasteScore: number }

/**
 * Recommends movies from the user's own library: takes their favorite or highly-rated
 * (>= MIN_SEED_RATING) movies as seeds, pulls each seed's TMDB `recommendations` + `similar`,
 * aggregates how strongly the library points at each candidate (the "taste" signal),
 * then re-ranks the top candidates by IMDb + Rotten Tomatoes so quality — not TMDB's
 * score — decides the order. Anything already in the library is excluded. The top
 * POOL_SIZE are IMDb/RT-ranked; beyond that (for a bigger `limit`) the tail stays in
 * taste order since the ratings endpoint is capped.
 */
export function useLibraryRecommendations(limit = RESULT_LIMIT) {
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)

  const seeds = useMemo(() => pickSeeds(library ?? []), [library])

  const seedQueries = useQueries({
    queries: seeds.map((seed) => ({
      queryKey: ['movie-details', seed.tmdbId],
      queryFn: () => getMovieDetails(seed.tmdbId),
      staleTime: 1000 * 60 * 10,
    })),
  })

  const seedsLoading = seeds.length > 0 && seedQueries.some((query) => query.isLoading)
  const seedSignature = seedQueries.map((query) => query.dataUpdatedAt).join(',')

  // Stage 1 — full taste-relevance ranking from the library graph.
  const tasteRanked = useMemo(() => {
    if (seeds.length === 0) {
      return [] as TasteEntry[]
    }

    const details = seedQueries.map((query) => query.data as MovieDetails | undefined)
    return aggregateByTaste(details, seeds, library ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedSignature, seeds, library])

  // Stage 2 — quality re-ranking (IMDb + RT) of the top slice; the rest keeps taste order.
  const externalPool = useMemo(() => tasteRanked.slice(0, POOL_SIZE), [tasteRanked])
  const poolItems = useMemo(() => externalPool.map((entry) => ({ mediaType: entry.item.mediaType, tmdbId: entry.item.tmdbId })), [externalPool])
  const { ratingsMap, isLoading: ratingsLoading } = useExternalRatingsPool(poolItems, poolItems.length > 0, POOL_SIZE)

  const recommendations = useMemo(() => {
    const top = rankByExternalBlend(externalPool, ratingsMap)
    const tail = tasteRanked.slice(POOL_SIZE).map((entry) => entry.item)
    return [...top, ...tail].slice(0, limit)
  }, [externalPool, ratingsMap, tasteRanked, limit])

  const isLoading = seedsLoading || (tasteRanked.length > 0 && ratingsLoading && ratingsMap.size === 0)

  return { recommendations, isLoading, hasSeeds: seeds.length > 0, isAuthenticated }
}

function pickSeeds(library: LibraryItem[]): LibraryItem[] {
  // Only seed from movies the user actually liked: favorites or high ratings.
  // A watched-but-low-rated movie is a negative signal, so it never seeds.
  return library
    .filter((item) => item.mediaType === 'Movie' && (item.isFavorite || (item.rating ?? 0) >= MIN_SEED_RATING))
    .map((item) => ({ item, score: seedScore(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SEED_LIMIT)
    .map((entry) => entry.item)
}

const MIN_SEED_RATING = 7

// Seeds are already "liked"; order them so the best-rated titles seed first, with a
// bump for favorites (a favorite with no rating still counts as a strong signal).
function seedScore(item: LibraryItem) {
  return (item.rating ?? 0) + (item.isFavorite ? 6 : 0)
}

function aggregateByTaste(details: Array<MovieDetails | undefined>, seeds: LibraryItem[], library: LibraryItem[]): TasteEntry[] {
  const excluded = new Set(library.map((item) => `${item.mediaType}-${item.tmdbId}`))
  seeds.forEach((seed) => excluded.add(`Movie-${seed.tmdbId}`))

  const scored = new Map<string, TasteEntry>()

  details.forEach((detail, index) => {
    if (!detail) {
      return
    }

    const seed = seeds[index]
    const seedWeight = 1 + (seed.rating ?? 5) / 10 + (seed.isFavorite ? 0.5 : 0)

    for (const candidate of [...(detail.recommendations ?? []), ...(detail.similar ?? [])]) {
      const key = `${candidate.mediaType}-${candidate.tmdbId}`
      if (excluded.has(key)) {
        continue
      }

      const existing = scored.get(key)
      if (existing) {
        existing.tasteScore += seedWeight
      } else {
        scored.set(key, { item: candidate, tasteScore: seedWeight })
      }
    }
  })

  return [...scored.values()].sort((a, b) => b.tasteScore - a.tasteScore)
}

function rankByExternalBlend(entries: TasteEntry[], ratingsMap: Map<string, ExternalRating[]>): MediaSummary[] {
  return entries
    .map((entry) => {
      const quality = externalQualityScore(ratingsMap.get(getRatingsKey(entry.item.mediaType, entry.item.tmdbId)))
      const hasExternal = quality !== null
      const base = hasExternal ? quality : (entry.item.voteAverage ?? 0) * 0.5
      return { item: entry.item, hasExternal, score: base + entry.tasteScore * 0.25 }
    })
    .sort((left, right) => {
      // IMDb/RT-rated titles first, then by blended quality + taste.
      if (left.hasExternal !== right.hasExternal) {
        return left.hasExternal ? -1 : 1
      }
      return right.score - left.score
    })
    .map((entry) => entry.item)
}
