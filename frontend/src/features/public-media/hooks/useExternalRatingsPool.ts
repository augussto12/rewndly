import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { MediaKind } from '../../user-content/types/userContent.types'
import { getExternalRatingsBatch } from '../services/publicMediaApi'
import { toRatingsMap } from '../utils/externalRatings'

const BATCH_SIZE = 12

/**
 * Fetches external ratings (IMDb / Rotten Tomatoes / ...) for a pool of items.
 * The batch endpoint caps at 12 items per call, so we split the pool into chunks,
 * run the calls in parallel, and merge them into a single lookup map keyed by
 * `mediaType-tmdbId`. Query keys match useExternalRatingsBatch so the cache is shared.
 */
export function useExternalRatingsPool(items: Array<{ mediaType: MediaKind; tmdbId: number }>, enabled = true, maxItems = 24) {
  const pool = items.slice(0, maxItems)
  const chunks: Array<Array<{ mediaType: MediaKind; tmdbId: number }>> = []
  for (let index = 0; index < pool.length; index += BATCH_SIZE) {
    chunks.push(pool.slice(index, index + BATCH_SIZE))
  }

  const queries = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: ['external-ratings-batch', chunk.map((item) => `${item.mediaType}-${item.tmdbId}`).join('|')],
      queryFn: () => getExternalRatingsBatch(chunk),
      enabled: enabled && chunk.length > 0,
      staleTime: 60 * 60 * 1000,
    })),
  })

  const signature = queries.map((query) => query.dataUpdatedAt).join(',')
  const ratingsMap = useMemo(
    () => toRatingsMap(queries.flatMap((query) => query.data ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  )
  const isLoading = enabled && pool.length > 0 && queries.some((query) => query.isLoading)

  return { ratingsMap, isLoading }
}
