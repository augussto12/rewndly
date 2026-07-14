import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { discoverMovies } from '../services/publicMediaApi'
import type { MediaSummary } from '../types/publicMedia.types'
import { sortByExternalQuality } from '../utils/externalRatings'
import { useExternalRatingsPool } from './useExternalRatingsPool'

const POOL_SIZE = 24
const ROTATION_PAGES = 3

/** Day-of-year, used to rotate which page of "gems" we surface so it changes daily. */
function rotationSeed() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000)
}

/**
 * "Joyas": well-rated recent movies re-ranked by IMDb + Rotten Tomatoes. The base
 * TMDB query (vote_average.desc) is deterministic, so we rotate the fetched page by
 * day to keep the shelf fresh, and the IMDb/RT re-rank drops obscure no-data titles.
 */
export function useGems(limit = 12) {
  const page = useMemo(() => (rotationSeed() % ROTATION_PAGES) + 1, [])

  const discover = useQuery({
    queryKey: ['gems', page],
    queryFn: () => discoverMovies({ sortBy: 'vote_average.desc', minVoteAverage: 7.2, yearFrom: 2011 }, page),
    staleTime: 1000 * 60 * 60,
  })

  const pool = useMemo(() => (discover.data?.items ?? []).slice(0, POOL_SIZE), [discover.data])

  const { ratingsMap, isLoading: ratingsLoading } = useExternalRatingsPool(
    pool.map((item) => ({ mediaType: item.mediaType, tmdbId: item.tmdbId })),
    pool.length > 0,
    POOL_SIZE,
  )

  const items = useMemo<MediaSummary[]>(() => sortByExternalQuality(pool, ratingsMap).slice(0, limit), [pool, ratingsMap, limit])
  const isLoading = discover.isLoading || (pool.length > 0 && ratingsLoading && ratingsMap.size === 0)

  return { items, isLoading }
}
