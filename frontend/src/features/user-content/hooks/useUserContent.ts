import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../components/feedback/Toast/toastStore'
import { getErrorMessage } from '../../../services/apiError'
import {
  addListItem,
  createLibraryItem,
  createList,
  createReview,
  deleteLibraryItem,
  deleteList,
  deleteListItem,
  deleteReview,
  getListDetails,
  getMediaReviews,
  getMyLibrary,
  getMyLists,
  getMyReviews,
  updateLibraryItem,
  updateList,
  updateReview,
} from '../services/userContentApi'
import type { LibraryItemRequest, ReviewRequest, UserListItemRequest, UserListRequest } from '../types/userContent.types'

export function useMyLibrary(enabled = true) {
  return useQuery({
    queryKey: ['my-library'],
    queryFn: getMyLibrary,
    enabled,
  })
}

export function useMediaReviews(mediaType: string, tmdbId: number) {
  return useQuery({
    queryKey: ['media-reviews', mediaType, tmdbId],
    queryFn: () => getMediaReviews(mediaType, tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}

export function useMyReviews() {
  return useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews,
  })
}

export function useMyLists(enabled = true) {
  return useQuery({
    queryKey: ['my-lists'],
    queryFn: getMyLists,
    enabled,
  })
}

export function useListDetails(id: string | undefined) {
  return useQuery({
    queryKey: ['my-list', id],
    queryFn: () => getListDetails(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: LibraryItemRequest) => createLibraryItem(request),
    onSuccess: () => {
      toast.success('Guardado en biblioteca', 'El contenido ya esta en tu biblioteca.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo guardar en biblioteca.'),
  })
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: LibraryItemRequest }) => updateLibraryItem(id, request),
    onSuccess: () => {
      toast.success('Biblioteca actualizada', 'Tus cambios quedaron guardados.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo actualizar tu biblioteca.'),
  })
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLibraryItem,
    onSuccess: () => {
      toast.success('Quitado de biblioteca', 'El contenido salio de tu biblioteca.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo quitar de biblioteca.'),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ReviewRequest) => createReview(request),
    onSuccess: (_review, request) => {
      toast.success('Reseña publicada', 'Tu opinion ya aparece en el detalle.')
      void queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['media-reviews', request.mediaType, request.tmdbId] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo publicar la reseña.'),
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ReviewRequest }) => updateReview(id, request),
    onSuccess: () => {
      toast.success('Reseña actualizada', 'Tus cambios quedaron guardados.')
      void queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo actualizar la reseña.'),
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success('Reseña eliminada', 'La reseña ya no aparece en tu perfil.')
      void queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo eliminar la reseña.'),
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UserListRequest) => createList(request),
    onSuccess: (_list, request) => {
      toast.success('Lista creada', request.visibility === 'Private' ? 'Quedo visible solo para vos.' : 'Ya podes agregar contenido.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      if (request.visibility === 'Public') {
        void queryClient.invalidateQueries({ queryKey: ['public-lists'] })
        void queryClient.invalidateQueries({ queryKey: ['public-lists-pages'] })
      }
    },
    onError: (error) => notifyActionError(error, 'No se pudo crear la lista.'),
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UserListRequest }) => updateList(id, request),
    onSuccess: (_list, args) => {
      toast.success('Lista actualizada', 'Tus cambios quedaron guardados.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.id] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo actualizar la lista.'),
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      toast.success('Lista eliminada', 'La lista fue quitada de tu cuenta.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo eliminar la lista.'),
  })
}

export function useAddListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UserListItemRequest }) => addListItem(id, request),
    onSuccess: (_item, args) => {
      toast.success('Agregado a la lista', 'El contenido ya esta en la lista seleccionada.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.id] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo agregar a la lista.'),
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) => deleteListItem(listId, itemId),
    onSuccess: (_value, args) => {
      toast.success('Quitado de la lista', 'El contenido ya no esta en esa lista.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.listId] })
    },
    onError: (error) => notifyActionError(error, 'No se pudo quitar de la lista.'),
  })
}

function notifyActionError(error: unknown, fallback: string) {
  toast.error('No se pudo completar la accion', getErrorMessage(error, fallback))
}
