import { httpClient } from '../../../services/httpClient'
import type {
  CollectionDetails,
  CompanyDetails,
  DiscoverFilters,
  EpisodeDetails,
  ExternalRatingsBatchItem,
  Genre,
  KeywordDetails,
  MediaSummary,
  MediaReview,
  MediaRankingResponse,
  MovieDetails,
  NetworkDetails,
  PagedResponse,
  PersonDetails,
  PersonSummary,
  PublicHomeResponse,
  SeasonDetails,
  SeriesDetails,
  WatchProvidersBatchItem,
  WatchProviderOption,
} from '../types/publicMedia.types'

export function getPublicHome() {
  return httpClient<PublicHomeResponse>('/api/public/home')
}

export function searchMovies(query: string, page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`)
}

export function getTrendingMovies(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/trending?page=${page}`)
}

export function getNowPlayingMovies(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/now-playing?page=${page}`)
}

export function getPopularMovies(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/popular?page=${page}`)
}

export function getUpcomingMovies(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/upcoming?page=${page}`)
}

export function getTopRatedMovies(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/top-rated?page=${page}`)
}

export function getMovieRanking(rankingKey: string, page = 1, pageSize = 24) {
  return httpClient<MediaRankingResponse>(`/api/movies/rankings/${encodeURIComponent(rankingKey)}?page=${page}&pageSize=${pageSize}`)
}

export function discoverMovies(filters: Omit<DiscoverFilters, 'mediaType'>, page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/movies/discover?${toSearchParams({ ...filters, page })}`)
}

export function getMovieDetails(tmdbId: number) {
  return httpClient<MovieDetails>(`/api/movies/${tmdbId}`)
}

export function getExternalRatingsBatch(items: Array<{ mediaType: 'Movie' | 'Series'; tmdbId: number }>) {
  return httpClient<ExternalRatingsBatchItem[]>('/api/media/ratings/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export function getWatchProvidersBatch(items: Array<{ mediaType: 'Movie' | 'Series'; tmdbId: number }>) {
  return httpClient<WatchProvidersBatchItem[]>('/api/media/watch-providers/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export function searchSeries(query: string, page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/search?query=${encodeURIComponent(query)}&page=${page}`)
}

export function getTrendingSeries(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/trending?page=${page}`)
}

export function getPopularSeries(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/popular?page=${page}`)
}

export function getTopRatedSeries(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/top-rated?page=${page}`)
}

export function getSeriesRanking(rankingKey: string, page = 1, pageSize = 24) {
  return httpClient<MediaRankingResponse>(`/api/series/rankings/${encodeURIComponent(rankingKey)}?page=${page}&pageSize=${pageSize}`)
}

export function getAiringTodaySeries(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/airing-today?page=${page}`)
}

export function getOnTheAirSeries(page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/on-the-air?page=${page}`)
}

export function discoverSeries(filters: Omit<DiscoverFilters, 'mediaType'>, page = 1) {
  return httpClient<PagedResponse<MediaSummary>>(`/api/series/discover?${toSearchParams({ ...filters, page })}`)
}

export function getSeriesDetails(tmdbId: number) {
  return httpClient<SeriesDetails>(`/api/series/${tmdbId}`)
}

export function getSeasonDetails(seriesTmdbId: number, seasonNumber: number) {
  return httpClient<SeasonDetails>(`/api/series/${seriesTmdbId}/seasons/${seasonNumber}`)
}

export function getEpisodeDetails(seriesTmdbId: number, seasonNumber: number, episodeNumber: number) {
  return httpClient<EpisodeDetails>(`/api/series/${seriesTmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}`)
}

export function getMovieGenres() {
  return httpClient<Genre[]>('/api/genres/movies')
}

export function getSeriesGenres() {
  return httpClient<Genre[]>('/api/genres/series')
}

export function getMovieWatchProviders() {
  return httpClient<WatchProviderOption[]>('/api/watch-providers/movies')
}

export function getSeriesWatchProviders() {
  return httpClient<WatchProviderOption[]>('/api/watch-providers/series')
}

export function searchPeople(query: string, page = 1) {
  return httpClient<PagedResponse<PersonSummary>>(`/api/people/search?query=${encodeURIComponent(query)}&page=${page}`)
}

export function getTrendingPeople(page = 1) {
  return httpClient<PagedResponse<PersonSummary>>(`/api/people/trending?page=${page}`)
}

export function getPopularPeople(page = 1) {
  return httpClient<PagedResponse<PersonSummary>>(`/api/people/popular?page=${page}`)
}

export function getPersonDetails(tmdbId: number) {
  return httpClient<PersonDetails>(`/api/people/${tmdbId}`)
}

export function getCollectionDetails(collectionId: number) {
  return httpClient<CollectionDetails>(`/api/collections/${collectionId}`)
}

export function getCompanyDetails(companyId: number) {
  return httpClient<CompanyDetails>(`/api/companies/${companyId}`)
}

export function getNetworkDetails(networkId: number) {
  return httpClient<NetworkDetails>(`/api/networks/${networkId}`)
}

export function getKeywordDetails(keywordId: number) {
  return httpClient<KeywordDetails>(`/api/keywords/${keywordId}`)
}

export function getTmdbReviewDetails(reviewId: string) {
  return httpClient<MediaReview>(`/api/tmdb-reviews/${encodeURIComponent(reviewId)}`)
}

function toSearchParams(filters: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}
