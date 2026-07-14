import { useMemo } from 'react'
import { flattenUniquePages } from '../../../lib/pagination'
import type { ExternalRating, MediaSummary } from '../types/publicMedia.types'
import { externalQualityScore, getRatingsKey } from '../utils/externalRatings'
import { useExternalRatingsPool } from './useExternalRatingsPool'
import { useDiscoverMediaPages } from './usePublicMedia'

const POOL_SIZE = 24
const RESULT_LIMIT = 12

/**
 * "Best movies of a given year" ranked by IMDb + Rotten Tomatoes. We build a pool of
 * recognizable titles from that year (TMDB popularity, with a light quality floor),
 * fetch their external ratings, and re-rank by IMDb/RT — titles without IMDb/RT data
 * fall to the back rather than polluting the top.
 */
export function useBestMoviesOfYear(year: number) {
  const discover = useDiscoverMediaPages({ mediaType: 'Movie', year, sortBy: 'popularity.desc', minVoteAverage: 6 })

  const pool = useMemo(
    () => flattenUniquePages<MediaSummary>(discover.data, (item) => `${item.mediaType}-${item.tmdbId}`).slice(0, POOL_SIZE),
    [discover.data],
  )

  const { ratingsMap, isLoading: ratingsLoading } = useExternalRatingsPool(
    pool.map((item) => ({ mediaType: item.mediaType, tmdbId: item.tmdbId })),
    pool.length > 0,
    POOL_SIZE,
  )

  const items = useMemo(() => rankByExternal(pool, ratingsMap).slice(0, RESULT_LIMIT), [pool, ratingsMap])
  const isLoading = discover.isLoading || (pool.length > 0 && ratingsLoading && ratingsMap.size === 0)

  return { items, isLoading }
}

function rankByExternal(items: MediaSummary[], ratingsMap: Map<string, ExternalRating[]>): MediaSummary[] {
  return items
    .map((item) => ({ item, score: externalQualityScore(ratingsMap.get(getRatingsKey(item.mediaType, item.tmdbId))) }))
    .sort((left, right) => {
      if (left.score === null && right.score === null) return 0
      if (left.score === null) return 1
      if (right.score === null) return -1
      return right.score - left.score
    })
    .map((entry) => entry.item)
}
