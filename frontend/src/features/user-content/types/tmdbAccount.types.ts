import type { MediaKind } from './userContent.types'
import type { MediaSummary } from '../../public-media/types/publicMedia.types'

export type TmdbConnectionStatus = {
  isConnected: boolean
  accountId: number | null
  username: string | null
  displayName: string | null
  connectedAt: string | null
  lastSyncedAt: string | null
}

export type TmdbConnectResponse = {
  requestToken: string
  authorizationUrl: string
  expiresAt: string
}

export type TmdbMediaState = {
  favorite: boolean
  watchlist: boolean
  rating: number | null
}

export type TmdbAccountLibrary = {
  favoriteMovies: MediaSummary[]
  favoriteSeries: MediaSummary[]
  watchlistMovies: MediaSummary[]
  watchlistSeries: MediaSummary[]
  ratedMovies: MediaSummary[]
  ratedSeries: MediaSummary[]
}

export type TmdbAccountSync = {
  imported: number
  updated: number
  remoteLibrary: TmdbAccountLibrary
}

export type TmdbAccountAction = {
  mediaType: MediaKind
  tmdbId: number
  value: boolean
}

export type TmdbRatingAction = {
  mediaType: MediaKind
  tmdbId: number
  value: number
}
