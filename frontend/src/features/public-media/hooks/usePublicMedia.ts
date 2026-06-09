import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  discoverMovies,
  discoverSeries,
  getExternalRatingsBatch,
  getAiringTodaySeries,
  getCollectionDetails,
  getCompanyDetails,
  getMovieGenres,
  getMovieDetails,
  getMovieRanking,
  getMovieWatchProviders,
  getNowPlayingMovies,
  getTrendingMovies,
  getUpcomingMovies,
  getKeywordDetails,
  getNetworkDetails,
  getPersonDetails,
  getOnTheAirSeries,
  getPopularMovies,
  getPopularPeople,
  getPopularSeries,
  getPublicHome,
  getSeriesDetails,
  getSeriesGenres,
  getSeriesRanking,
  getSeriesWatchProviders,
  getSeasonDetails,
  getTopRatedMovies,
  getTopRatedSeries,
  getTrendingPeople,
  getTrendingSeries,
  getEpisodeDetails,
  getTmdbReviewDetails,
  searchPeople,
  searchMovies,
  searchSeries,
} from '../services/publicMediaApi'
import type { DiscoverFilters } from '../types/publicMedia.types'
import type { MediaKind } from '../../user-content/types/userContent.types'

export type MovieBrowseCategory = 'popular' | 'trending' | 'now-playing' | 'upcoming' | 'top-rated'
export type SeriesBrowseCategory = 'popular' | 'trending' | 'airing-today' | 'on-the-air' | 'top-rated'
export type ExternalRankingKey = 'imdb' | 'critics'
export type PeopleBrowseCategory = 'popular' | 'trending'

export function usePublicHome() {
  return useQuery({
    queryKey: ['public-home'],
    queryFn: getPublicHome,
  })
}

export function useExternalRatingsBatch(
  items: Array<{ mediaType: MediaKind; tmdbId: number }>,
  enabled = true,
) {
  const limitedItems = items.slice(0, 12)

  return useQuery({
    queryKey: ['external-ratings-batch', limitedItems.map((item) => `${item.mediaType}-${item.tmdbId}`).join('|')],
    queryFn: () => getExternalRatingsBatch(limitedItems),
    enabled: enabled && limitedItems.length > 0,
    staleTime: 60 * 60 * 1000,
  })
}

export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ['movies-search', query],
    queryFn: () => searchMovies(query, 1),
    enabled: query.trim().length >= 2,
  })
}

export function useMovieBrowse(category: MovieBrowseCategory, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['movies-browse', category],
    queryFn: ({ pageParam }) => getMovieBrowsePage(category, pageParam),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useMovieSearchPages(query: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['movies-search-pages', query],
    queryFn: ({ pageParam }) => searchMovies(query, pageParam),
    initialPageParam: 1,
    enabled: enabled && query.trim().length >= 2,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useSeriesSearch(query: string) {
  return useQuery({
    queryKey: ['series-search', query],
    queryFn: () => searchSeries(query, 1),
    enabled: query.trim().length >= 2,
  })
}

export function useSeriesBrowse(category: SeriesBrowseCategory, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['series-browse', category],
    queryFn: ({ pageParam }) => getSeriesBrowsePage(category, pageParam),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useSeriesSearchPages(query: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['series-search-pages', query],
    queryFn: ({ pageParam }) => searchSeries(query, pageParam),
    initialPageParam: 1,
    enabled: enabled && query.trim().length >= 2,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useMovieRanking(rankingKey: ExternalRankingKey, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['movies-ranking', rankingKey],
    queryFn: ({ pageParam }) => getMovieRanking(rankingKey, pageParam),
    initialPageParam: 1,
    enabled,
    staleTime: 60 * 60 * 1000,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useSeriesRanking(rankingKey: ExternalRankingKey, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['series-ranking', rankingKey],
    queryFn: ({ pageParam }) => getSeriesRanking(rankingKey, pageParam),
    initialPageParam: 1,
    enabled,
    staleTime: 60 * 60 * 1000,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useMovieDetails(tmdbId: number) {
  return useQuery({
    queryKey: ['movie-details', tmdbId],
    queryFn: () => getMovieDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}

export function useTopRatedMovies() {
  return useQuery({
    queryKey: ['movies-top-rated'],
    queryFn: () => getTopRatedMovies(1),
  })
}

export function useSeriesDetails(tmdbId: number) {
  return useQuery({
    queryKey: ['series-details', tmdbId],
    queryFn: () => getSeriesDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}

export function useSeasonDetails(seriesTmdbId: number, seasonNumber: number) {
  return useQuery({
    queryKey: ['season-details', seriesTmdbId, seasonNumber],
    queryFn: () => getSeasonDetails(seriesTmdbId, seasonNumber),
    enabled: Number.isFinite(seriesTmdbId) && Number.isFinite(seasonNumber),
  })
}

export function useEpisodeDetails(seriesTmdbId: number, seasonNumber: number, episodeNumber: number) {
  return useQuery({
    queryKey: ['episode-details', seriesTmdbId, seasonNumber, episodeNumber],
    queryFn: () => getEpisodeDetails(seriesTmdbId, seasonNumber, episodeNumber),
    enabled: Number.isFinite(seriesTmdbId) && Number.isFinite(seasonNumber) && Number.isFinite(episodeNumber),
  })
}

export function useTopRatedSeries() {
  return useQuery({
    queryKey: ['series-top-rated'],
    queryFn: () => getTopRatedSeries(1),
  })
}

export function useAiringTodaySeries() {
  return useQuery({
    queryKey: ['series-airing-today'],
    queryFn: () => getAiringTodaySeries(1),
  })
}

export function useOnTheAirSeries() {
  return useQuery({
    queryKey: ['series-on-the-air'],
    queryFn: () => getOnTheAirSeries(1),
  })
}

export function useDiscoverMedia(filters: DiscoverFilters) {
  return useQuery({
    queryKey: ['discover-media', filters],
    queryFn: () => {
      const { mediaType, ...request } = filters
      return mediaType === 'Movie' ? discoverMovies(request, 1) : discoverSeries(request, 1)
    },
  })
}

export function useDiscoverMediaPages(filters: DiscoverFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['discover-media-pages', filters],
    queryFn: ({ pageParam }) => {
      const { mediaType, ...request } = filters
      return mediaType === 'Movie' ? discoverMovies(request, pageParam) : discoverSeries(request, pageParam)
    },
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function useDiscoverOptions(mediaType: 'Movie' | 'Series') {
  const genres = useQuery({
    queryKey: ['discover-genres', mediaType],
    queryFn: () => (mediaType === 'Movie' ? getMovieGenres() : getSeriesGenres()),
  })

  const watchProviders = useQuery({
    queryKey: ['discover-watch-providers', mediaType],
    queryFn: () => (mediaType === 'Movie' ? getMovieWatchProviders() : getSeriesWatchProviders()),
  })

  return { genres, watchProviders }
}

export function usePeopleSearch(query: string) {
  return useQuery({
    queryKey: ['people-search', query],
    queryFn: () => searchPeople(query, 1),
    enabled: query.trim().length >= 2,
  })
}

export function usePeopleBrowse(category: PeopleBrowseCategory) {
  return useInfiniteQuery({
    queryKey: ['people-browse', category],
    queryFn: ({ pageParam }) => (category === 'trending' ? getTrendingPeople(pageParam) : getPopularPeople(pageParam)),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function usePeopleSearchPages(query: string) {
  return useInfiniteQuery({
    queryKey: ['people-search-pages', query],
    queryFn: ({ pageParam }) => searchPeople(query, pageParam),
    initialPageParam: 1,
    enabled: query.trim().length >= 2,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

export function usePersonDetails(tmdbId: number) {
  return useQuery({
    queryKey: ['person-details', tmdbId],
    queryFn: () => getPersonDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}

export function useCollectionDetails(collectionId: number) {
  return useQuery({
    queryKey: ['collection-details', collectionId],
    queryFn: () => getCollectionDetails(collectionId),
    enabled: Number.isFinite(collectionId),
  })
}

export function useCompanyDetails(companyId: number) {
  return useQuery({
    queryKey: ['company-details', companyId],
    queryFn: () => getCompanyDetails(companyId),
    enabled: Number.isFinite(companyId),
  })
}

export function useNetworkDetails(networkId: number) {
  return useQuery({
    queryKey: ['network-details', networkId],
    queryFn: () => getNetworkDetails(networkId),
    enabled: Number.isFinite(networkId),
  })
}

export function useKeywordDetails(keywordId: number) {
  return useQuery({
    queryKey: ['keyword-details', keywordId],
    queryFn: () => getKeywordDetails(keywordId),
    enabled: Number.isFinite(keywordId),
  })
}

export function useTmdbReviewDetails(reviewId: string | undefined) {
  return useQuery({
    queryKey: ['tmdb-review-details', reviewId],
    queryFn: () => getTmdbReviewDetails(reviewId ?? ''),
    enabled: Boolean(reviewId?.trim()),
  })
}

function getMovieBrowsePage(category: MovieBrowseCategory, page: number) {
  switch (category) {
    case 'trending':
      return getTrendingMovies(page)
    case 'now-playing':
      return getNowPlayingMovies(page)
    case 'upcoming':
      return getUpcomingMovies(page)
    case 'top-rated':
      return getTopRatedMovies(page)
    case 'popular':
    default:
      return getPopularMovies(page)
  }
}

function getSeriesBrowsePage(category: SeriesBrowseCategory, page: number) {
  switch (category) {
    case 'trending':
      return getTrendingSeries(page)
    case 'airing-today':
      return getAiringTodaySeries(page)
    case 'on-the-air':
      return getOnTheAirSeries(page)
    case 'top-rated':
      return getTopRatedSeries(page)
    case 'popular':
    default:
      return getPopularSeries(page)
  }
}
