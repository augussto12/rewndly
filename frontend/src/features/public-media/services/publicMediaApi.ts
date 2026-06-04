import { httpClient } from '../../../services/httpClient'
import type { MediaSummary, MovieDetails, PublicHomeResponse, SeriesDetails } from '../types/publicMedia.types'

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

export function getSeriesDetails(tmdbId: number) {
  return httpClient<SeriesDetails>(`/api/series/${tmdbId}`)
}
