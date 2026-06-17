import { api } from './client'
import type {
  DiscoverFilters,
  Genre,
  LibraryItem,
  LibraryItemRequest,
  MediaRankingResponse,
  MediaSummary,
  MobileAuthResponse,
  MovieDetails,
  PagedResponse,
  PersonDetails,
  PersonSummary,
  PublicHomeResponse,
  Review,
  SeriesDetails,
  UserList,
  UserListDetails,
  UserListItem,
  UserListRequest,
  WatchProviderOption
} from './types'

export function getHome() {
  return api<PublicHomeResponse>('/api/public/home')
}

export function getTopRatedMovies(page = 1) {
  return api<PagedResponse<MediaSummary>>(`/api/movies/top-rated?page=${page}`)
}

export function getTopRatedSeries(page = 1) {
  return api<PagedResponse<MediaSummary>>(`/api/series/top-rated?page=${page}`)
}

export function getMovieRanking(rankingKey: 'imdb' | 'critics', page = 1, pageSize = 12) {
  return api<MediaRankingResponse>(`/api/movies/rankings/${rankingKey}?page=${page}&pageSize=${pageSize}`)
}

export function discoverMovies(filters: DiscoverFilters, page = 1) {
  return api<PagedResponse<MediaSummary>>(`/api/movies/discover?${toSearchParams({ ...filters, page })}`)
}

export function discoverSeries(filters: DiscoverFilters, page = 1) {
  return api<PagedResponse<MediaSummary>>(`/api/series/discover?${toSearchParams({ ...filters, page })}`)
}

export function getMovieGenres() {
  return api<Genre[]>('/api/genres/movies')
}

export function getSeriesGenres() {
  return api<Genre[]>('/api/genres/series')
}

export function getMovieWatchProviders() {
  return api<WatchProviderOption[]>('/api/watch-providers/movies')
}

export function getSeriesWatchProviders() {
  return api<WatchProviderOption[]>('/api/watch-providers/series')
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

export function createLibraryItem(request: LibraryItemRequest) {
  return api<LibraryItem>('/api/me/library/items', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export function updateLibraryItem(id: string, request: LibraryItemRequest) {
  return api<LibraryItem>(`/api/me/library/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  })
}

export function removeLibraryItem(id: string) {
  return api<void>(`/api/me/library/items/${id}`, { method: 'DELETE' })
}

export function getLists() {
  return api<UserList[]>('/api/me/lists')
}

export function getListDetails(id: string) {
  return api<UserListDetails>(`/api/me/lists/${id}`)
}

export function getReviews() {
  return api<Review[]>('/api/me/reviews')
}

export function createList(title: string) {
  return api<UserList>('/api/me/lists', {
    method: 'POST',
    body: JSON.stringify({ title, description: null, visibility: 'Private' })
  })
}

export function updateList(id: string, request: UserListRequest) {
  return api<UserList>(`/api/me/lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  })
}

export function deleteList(id: string) {
  return api<void>(`/api/me/lists/${id}`, { method: 'DELETE' })
}

export function addListItem(id: string, mediaType: 'Movie' | 'Series', tmdbId: number) {
  return api<UserListItem>(`/api/me/lists/${id}/items`, {
    method: 'POST',
    body: JSON.stringify({ mediaType, tmdbId, position: null, note: null })
  })
}

export function deleteListItem(listId: string, itemId: string) {
  return api<void>(`/api/me/lists/${listId}/items/${itemId}`, { method: 'DELETE' })
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

function toSearchParams(filters: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}
