import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeTmdbConnection,
  connectTmdbAccount,
  deleteTmdbRating,
  disconnectTmdbAccount,
  getTmdbConnectionStatus,
  getTmdbMediaState,
  getTmdbRemoteLibrary,
  setTmdbFavorite,
  setTmdbRating,
  setTmdbWatchlist,
  syncTmdbLibrary,
} from '../services/tmdbAccountApi'
import type { TmdbAccountAction, TmdbRatingAction } from '../types/tmdbAccount.types'
import type { MediaKind } from '../types/userContent.types'

export function useTmdbConnectionStatus(enabled = true) {
  return useQuery({
    queryKey: ['tmdb-connection-status'],
    queryFn: getTmdbConnectionStatus,
    enabled,
  })
}

export function useConnectTmdbAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: connectTmdbAccount,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] }),
  })
}

export function useCompleteTmdbConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeTmdbConnection,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] }),
  })
}

export function useDisconnectTmdbAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectTmdbAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
      void queryClient.removeQueries({ queryKey: ['tmdb-media-state'] })
      void queryClient.removeQueries({ queryKey: ['tmdb-remote-library'] })
    },
  })
}

export function useTmdbRemoteLibrary(enabled = true) {
  return useQuery({
    queryKey: ['tmdb-remote-library'],
    queryFn: getTmdbRemoteLibrary,
    enabled,
  })
}

export function useSyncTmdbLibrary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: syncTmdbLibrary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tmdb-remote-library'] })
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
  })
}

export function useTmdbMediaState(mediaType: MediaKind, tmdbId: number, enabled = true) {
  return useQuery({
    queryKey: ['tmdb-media-state', mediaType, tmdbId],
    queryFn: () => getTmdbMediaState(mediaType, tmdbId),
    enabled: enabled && Number.isFinite(tmdbId),
    retry: false,
  })
}

export function useSetTmdbFavorite() {
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbAccountAction) => setTmdbFavorite(mediaType, tmdbId, value))
}

export function useSetTmdbWatchlist() {
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbAccountAction) => setTmdbWatchlist(mediaType, tmdbId, value))
}

export function useSetTmdbRating() {
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbRatingAction) => setTmdbRating(mediaType, tmdbId, value))
}

export function useDeleteTmdbRating() {
  return useTmdbStateMutation(({ mediaType, tmdbId }: { mediaType: MediaKind; tmdbId: number }) => deleteTmdbRating(mediaType, tmdbId))
}

function useTmdbStateMutation<TArgs extends { mediaType: MediaKind; tmdbId: number }>(
  mutationFn: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (_value, args) => {
      void queryClient.invalidateQueries({ queryKey: ['tmdb-media-state', args.mediaType, args.tmdbId] })
      void queryClient.invalidateQueries({ queryKey: ['tmdb-remote-library'] })
    },
  })
}
