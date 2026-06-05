import { httpClient } from '../../../services/httpClient'
import type {
  CollectionDetails,
  CompanyDetails,
  DiscoverFilters,
  EpisodeDetails,
  Genre,
  KeywordDetails,
  MediaSummary,
  MediaReview,
  MovieDetails,
  NetworkDetails,
  PersonDetails,
  PersonSummary,
  PublicHomeResponse,
  SeasonDetails,
  SeriesDetails,
  WatchProviderOption,
} from '../types/publicMedia.types'

export function getPublicHome() {
  return httpClient<PublicHomeResponse>('/api/public/home')
}

export function searchMovies(query: string) {
  return httpClient<MediaSummary[]>(`/api/movies/search?query=${encodeURIComponent(query)}`)
}

export function getTrendingMovies() {
  return httpClient<MediaSummary[]>('/api/movies/trending')
}

export function getNowPlayingMovies() {
  return httpClient<MediaSummary[]>('/api/movies/now-playing')
}

export function getPopularMovies() {
  return httpClient<MediaSummary[]>('/api/movies/popular')
}

export function getUpcomingMovies() {
  return httpClient<MediaSummary[]>('/api/movies/upcoming')
}

export function getTopRatedMovies() {
  return httpClient<MediaSummary[]>('/api/movies/top-rated')
}

export function discoverMovies(filters: Omit<DiscoverFilters, 'mediaType'>) {
  return httpClient<MediaSummary[]>(`/api/movies/discover?${toSearchParams(filters)}`)
}

export function getMovieDetails(tmdbId: number) {
  return httpClient<MovieDetails>(`/api/movies/${tmdbId}`)
}

export function searchSeries(query: string) {
  return httpClient<MediaSummary[]>(`/api/series/search?query=${encodeURIComponent(query)}`)
}

export function getTrendingSeries() {
  return httpClient<MediaSummary[]>('/api/series/trending')
}

export function getPopularSeries() {
  return httpClient<MediaSummary[]>('/api/series/popular')
}

export function getTopRatedSeries() {
  return httpClient<MediaSummary[]>('/api/series/top-rated')
}

export function getAiringTodaySeries() {
  return httpClient<MediaSummary[]>('/api/series/airing-today')
}

export function getOnTheAirSeries() {
  return httpClient<MediaSummary[]>('/api/series/on-the-air')
}

export function discoverSeries(filters: Omit<DiscoverFilters, 'mediaType'>) {
  return httpClient<MediaSummary[]>(`/api/series/discover?${toSearchParams(filters)}`)
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

export function searchPeople(query: string) {
  return httpClient<PersonSummary[]>(`/api/people/search?query=${encodeURIComponent(query)}`)
}

export function getTrendingPeople() {
  return httpClient<PersonSummary[]>('/api/people/trending')
}

export function getPopularPeople() {
  return httpClient<PersonSummary[]>('/api/people/popular')
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

function toSearchParams(filters: Omit<DiscoverFilters, 'mediaType'>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}
