import { useQuery } from '@tanstack/react-query'
import {
  discoverMovies,
  discoverSeries,
  getAiringTodaySeries,
  getCollectionDetails,
  getCompanyDetails,
  getMovieGenres,
  getMovieDetails,
  getMovieWatchProviders,
  getKeywordDetails,
  getNetworkDetails,
  getPersonDetails,
  getOnTheAirSeries,
  getPublicHome,
  getSeriesDetails,
  getSeriesGenres,
  getSeriesWatchProviders,
  getSeasonDetails,
  getTopRatedMovies,
  getTopRatedSeries,
  getEpisodeDetails,
  getTmdbReviewDetails,
  searchPeople,
  searchMovies,
  searchSeries,
} from '../services/publicMediaApi'
import type { DiscoverFilters } from '../types/publicMedia.types'

export function usePublicHome() {
  return useQuery({
    queryKey: ['public-home'],
    queryFn: getPublicHome,
  })
}

export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ['movies-search', query],
    queryFn: () => searchMovies(query),
    enabled: query.trim().length >= 2,
  })
}

export function useSeriesSearch(query: string) {
  return useQuery({
    queryKey: ['series-search', query],
    queryFn: () => searchSeries(query),
    enabled: query.trim().length >= 2,
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
    queryFn: getTopRatedMovies,
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
    queryFn: getTopRatedSeries,
  })
}

export function useAiringTodaySeries() {
  return useQuery({
    queryKey: ['series-airing-today'],
    queryFn: getAiringTodaySeries,
  })
}

export function useOnTheAirSeries() {
  return useQuery({
    queryKey: ['series-on-the-air'],
    queryFn: getOnTheAirSeries,
  })
}

export function useDiscoverMedia(filters: DiscoverFilters) {
  return useQuery({
    queryKey: ['discover-media', filters],
    queryFn: () => {
      const { mediaType, ...request } = filters
      return mediaType === 'Movie' ? discoverMovies(request) : discoverSeries(request)
    },
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
    queryFn: () => searchPeople(query),
    enabled: query.trim().length >= 2,
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
