import { httpClient } from '../../../services/httpClient'
import type {
  TmdbAccountLibrary,
  TmdbAccountSync,
  TmdbConnectResponse,
  TmdbConnectionStatus,
  TmdbMediaState,
} from '../types/tmdbAccount.types'
import type { MediaKind } from '../types/userContent.types'

export function getTmdbConnectionStatus() {
  return httpClient<TmdbConnectionStatus>('/api/me/tmdb/status')
}

export function connectTmdbAccount() {
  return httpClient<TmdbConnectResponse>('/api/me/tmdb/connect', {
    method: 'POST',
  })
}

export function completeTmdbConnection(requestToken: string) {
  return httpClient<TmdbConnectionStatus>('/api/me/tmdb/complete', {
    method: 'POST',
    body: JSON.stringify({ requestToken }),
  })
}

export function disconnectTmdbAccount() {
  return httpClient<void>('/api/me/tmdb/connection', {
    method: 'DELETE',
  })
}

export function getTmdbRemoteLibrary() {
  return httpClient<TmdbAccountLibrary>('/api/me/tmdb/library')
}

export function syncTmdbLibrary() {
  return httpClient<TmdbAccountSync>('/api/me/tmdb/sync', {
    method: 'POST',
  })
}

export function getTmdbMediaState(mediaType: MediaKind, tmdbId: number) {
  return httpClient<TmdbMediaState>(`/api/me/tmdb/media/${mediaType}/${tmdbId}/state`)
}

export function setTmdbFavorite(mediaType: MediaKind, tmdbId: number, value: boolean) {
  return httpClient<TmdbMediaState>(`/api/me/tmdb/media/${mediaType}/${tmdbId}/favorite`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export function setTmdbWatchlist(mediaType: MediaKind, tmdbId: number, value: boolean) {
  return httpClient<TmdbMediaState>(`/api/me/tmdb/media/${mediaType}/${tmdbId}/watchlist`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export function setTmdbRating(mediaType: MediaKind, tmdbId: number, value: number) {
  return httpClient<TmdbMediaState>(`/api/me/tmdb/media/${mediaType}/${tmdbId}/rating`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export function deleteTmdbRating(mediaType: MediaKind, tmdbId: number) {
  return httpClient<TmdbMediaState>(`/api/me/tmdb/media/${mediaType}/${tmdbId}/rating`, {
    method: 'DELETE',
  })
}
