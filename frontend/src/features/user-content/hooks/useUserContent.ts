import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-library'] }),
  })
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: LibraryItemRequest }) => updateLibraryItem(id, request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-library'] }),
  })
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLibraryItem,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-library'] }),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ReviewRequest) => createReview(request),
    onSuccess: (_review, request) => {
      void queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['media-reviews', request.mediaType, request.tmdbId] })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: ReviewRequest }) => updateReview(id, request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UserListRequest) => createList(request),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-lists'] }),
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UserListRequest }) => updateList(id, request),
    onSuccess: (_list, args) => {
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.id] })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-lists'] }),
  })
}

export function useAddListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UserListItemRequest }) => addListItem(id, request),
    onSuccess: (_item, args) => {
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.id] })
    },
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) => deleteListItem(listId, itemId),
    onSuccess: (_value, args) => {
      void queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['my-list', args.listId] })
    },
  })
}
