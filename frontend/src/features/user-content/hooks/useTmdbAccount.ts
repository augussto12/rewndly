import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../components/feedback/Toast/toastStore'
import { getErrorMessage } from '../../../services/apiError'
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
    onSuccess: () => {
      toast.info('Redirigiendo a TMDB', 'Aprobá el acceso y volvés automáticamente.')
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
    },
    onError: (error) => notifyTmdbError(error, 'No se pudo iniciar la conexión con TMDB.'),
  })
}

export function useCompleteTmdbConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeTmdbConnection,
    onSuccess: () => {
      toast.success('TMDB conectado', 'Ya podés sincronizar favoritos, watchlist y ratings.')
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
    },
    onError: (error) => notifyTmdbError(error, 'No se pudo completar la conexión con TMDB.'),
  })
}

export function useDisconnectTmdbAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectTmdbAccount,
    onSuccess: () => {
      toast.success('TMDB desconectado', 'La cuenta remota dejó de estar vinculada.')
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
      void queryClient.removeQueries({ queryKey: ['tmdb-media-state'] })
      void queryClient.removeQueries({ queryKey: ['tmdb-remote-library'] })
    },
    onError: (error) => notifyTmdbError(error, 'No se pudo desconectar TMDB.'),
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
    onSuccess: (result) => {
      toast.success('Sync TMDB completa', `${result.imported} importados, ${result.updated} actualizados.`)
      void queryClient.invalidateQueries({ queryKey: ['tmdb-remote-library'] })
      void queryClient.invalidateQueries({ queryKey: ['tmdb-connection-status'] })
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error) => notifyTmdbError(error, 'No se pudo sincronizar TMDB.'),
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
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbAccountAction) => setTmdbFavorite(mediaType, tmdbId, value), 'Favoritos TMDB actualizados')
}

export function useSetTmdbWatchlist() {
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbAccountAction) => setTmdbWatchlist(mediaType, tmdbId, value), 'Watchlist TMDB actualizada')
}

export function useSetTmdbRating() {
  return useTmdbStateMutation(({ mediaType, tmdbId, value }: TmdbRatingAction) => setTmdbRating(mediaType, tmdbId, value), 'Rating TMDB guardado')
}

export function useDeleteTmdbRating() {
  return useTmdbStateMutation(({ mediaType, tmdbId }: { mediaType: MediaKind; tmdbId: number }) => deleteTmdbRating(mediaType, tmdbId), 'Rating TMDB eliminado')
}

function useTmdbStateMutation<TArgs extends { mediaType: MediaKind; tmdbId: number }>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  successTitle: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (_value, args) => {
      toast.success(successTitle, 'El cambio quedó aplicado en tu cuenta TMDB.')
      void queryClient.invalidateQueries({ queryKey: ['tmdb-media-state', args.mediaType, args.tmdbId] })
      void queryClient.invalidateQueries({ queryKey: ['tmdb-remote-library'] })
    },
    onError: (error) => notifyTmdbError(error, 'No se pudo actualizar TMDB.'),
  })
}

function notifyTmdbError(error: unknown, fallback: string) {
  toast.error('TMDB no pudo completar la acción', getErrorMessage(error, fallback))
}
