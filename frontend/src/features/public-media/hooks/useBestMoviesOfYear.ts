import { useMemo } from 'react'
import { flattenUniquePages } from '../../../lib/pagination'
import type { MediaSummary } from '../types/publicMedia.types'
import { sortByExternalQuality } from '../utils/externalRatings'
import { useExternalRatingsPool } from './useExternalRatingsPool'
import { useDiscoverMediaPages } from './usePublicMedia'

const POOL_SIZE = 24

/**
 * "Best movies of a given year" ranked by IMDb + Rotten Tomatoes. We build a pool of
 * recognizable titles from that year (TMDB popularity, light quality floor), fetch
 * their external ratings, and re-rank by IMDb/RT — titles without IMDb/RT data fall
 * to the back rather than polluting the top.
 */
export function useBestMoviesOfYear(year: number, limit = 12) {
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

  const items = useMemo(() => sortByExternalQuality(pool, ratingsMap).slice(0, limit), [pool, ratingsMap, limit])
  const isLoading = discover.isLoading || (pool.length > 0 && ratingsLoading && ratingsMap.size === 0)

  return { items, isLoading }
}
