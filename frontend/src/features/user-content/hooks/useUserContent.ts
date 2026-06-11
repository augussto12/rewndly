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

type ToastMutationContext = {
  toastId: string
}

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
    onMutate: () => showLoadingToast('Guardando en biblioteca', 'Estamos actualizando tu biblioteca.'),
    onSuccess: (_item, _request, context) => {
      notifyActionSuccess(context, 'Guardado en biblioteca', 'El contenido ya está en tu biblioteca.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error, _request, context) => notifyActionError(error, 'No se pudo guardar en biblioteca.', context),
  })
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: LibraryItemRequest }) => updateLibraryItem(id, request),
    onMutate: () => showLoadingToast('Guardando cambios', 'Estamos actualizando tu biblioteca.'),
    onSuccess: (_item, _request, context) => {
      notifyActionSuccess(context, 'Biblioteca actualizada', 'Tus cambios quedaron guardados.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error, _request, context) => notifyActionError(error, 'No se pudo actualizar tu biblioteca.', context),
  })
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLibraryItem,
    onMutate: () => showLoadingToast('Quitando de biblioteca', 'Estamos guardando el cambio.'),
    onSuccess: (_value, _id, context) => {
      notifyActionSuccess(context, 'Quitado de biblioteca', 'El contenido salió de tu biblioteca.')
      void queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
    onError: (error, _id, context) => notifyActionError(error, 'No se pudo quitar de biblioteca.', context),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ReviewRequest) => createReview(request),
    onSuccess: (_review, request) => {
      toast.success('Reseña publicada', 'Tu opinión ya aparece en el detalle.')
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
      toast.success('Lista creada', request.visibility === 'Private' ? 'Quedó visible solo para vos.' : 'Ya podés agregar contenido.')
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
    onMutate: () => showLoadingToast('Agregando a la lista', 'Estamos guardando el contenido.'),
    onSuccess: (_item, args, context) => {
      notifyActionSuccess(context, 'Agregado a la lista', 'El contenido ya está en la lista seleccionada.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.id] })
    },
    onError: (error, _args, context) => notifyActionError(error, 'No se pudo agregar a la lista.', context),
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) => deleteListItem(listId, itemId),
    onMutate: () => showLoadingToast('Quitando de la lista', 'Estamos guardando el cambio.'),
    onSuccess: (_value, args, context) => {
      notifyActionSuccess(context, 'Quitado de la lista', 'El contenido ya no está en esa lista.')
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.listId] })
    },
    onError: (error, _args, context) => notifyActionError(error, 'No se pudo quitar de la lista.', context),
  })
}

function showLoadingToast(title: string, description: string): ToastMutationContext {
  return { toastId: toast.loading(title, description) }
}

function notifyActionSuccess(context: ToastMutationContext | undefined, title: string, description: string) {
  if (context?.toastId) {
    toast.update(context.toastId, { title, description, tone: 'success' })
    return
  }

  toast.success(title, description)
}

function notifyActionError(error: unknown, fallback: string, context?: ToastMutationContext) {
  const description = getErrorMessage(error, fallback)
  if (context?.toastId) {
    toast.update(context.toastId, { title: 'No se pudo completar la acción', description, tone: 'error' })
    return
  }

  toast.error('No se pudo completar la acción', description)
}
