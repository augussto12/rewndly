import { api } from './client'
import type {
  LibraryItem,
  MediaSummary,
  MobileAuthResponse,
  MovieDetails,
  PagedResponse,
  PersonDetails,
  PersonSummary,
  PublicHomeResponse,
  SeriesDetails,
  UserList
} from './types'

export function getHome() {
  return api<PublicHomeResponse>('/api/public/home')
}

export async function searchAll(query: string) {
  const [movies, series, people] = await Promise.all([
    api<PagedResponse<MediaSummary>>(`/api/movies/search?query=${encodeURIComponent(query)}&page=1`),
    api<PagedResponse<MediaSummary>>(`/api/series/search?query=${encodeURIComponent(query)}&page=1`),
    api<PagedResponse<PersonSummary>>(`/api/people/search?query=${encodeURIComponent(query)}&page=1`)
  ])

  return { movies: movies.items, series: series.items, people: people.items }
}

export function getMovieDetails(tmdbId: number) {
  return api<MovieDetails>(`/api/movies/${tmdbId}`)
}

export function getSeriesDetails(tmdbId: number) {
  return api<SeriesDetails>(`/api/series/${tmdbId}`)
}

export function getPersonDetails(tmdbId: number) {
  return api<PersonDetails>(`/api/people/${tmdbId}`)
}

export function getLibrary() {
  return api<LibraryItem[]>('/api/me/library')
}

export function addToLibrary(mediaType: 'Movie' | 'Series', tmdbId: number, rating: number | null = null) {
  return api<LibraryItem>('/api/me/library/items', {
    method: 'POST',
    body: JSON.stringify({
      mediaType,
      tmdbId,
      status: 'WantToWatch',
      isFavorite: false,
      rating,
      watchedAt: null,
      startedAt: null
    })
  })
}

export function removeLibraryItem(id: string) {
  return api<void>(`/api/me/library/items/${id}`, { method: 'DELETE' })
}

export function getLists() {
  return api<UserList[]>('/api/me/lists')
}

export function createList(title: string) {
  return api<UserList>('/api/me/lists', {
    method: 'POST',
    body: JSON.stringify({ title, description: null, visibility: 'Private' })
  })
}

export function login(identifier: string, password: string) {
  return api<MobileAuthResponse>('/api/mobile/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
    skipRefresh: true
  })
}

export function register(username: string, email: string, password: string) {
  return api<MobileAuthResponse>('/api/mobile/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, displayName: username }),
    skipRefresh: true
  })
}

export function logout(refreshToken: string | null) {
  return api<void>('/api/mobile/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  })
}

export function me() {
  return api<MobileAuthResponse['user']>('/api/auth/me')
}
