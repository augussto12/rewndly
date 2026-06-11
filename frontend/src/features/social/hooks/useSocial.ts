import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../components/feedback/Toast/toastStore'
import { getErrorMessage } from '../../../services/apiError'
import {
  acceptFriendRequest,
  deleteFriendship,
  getFeed,
  getFriendRequests,
  getFriends,
  getPublicListDetails,
  getPublicLists,
  getPublicReviews,
  getUserLists,
  getUserProfile,
  getUserReviews,
  getUserStats,
  rejectFriendRequest,
  sendFriendRequest,
} from '../services/socialApi'

const publicPageSize = 30
const profilePageSize = 24

export function useFriends() {
  return useQuery({ queryKey: ['friends'], queryFn: getFriends })
}

export function useFriendRequests() {
  return useQuery({ queryKey: ['friend-requests'], queryFn: getFriendRequests })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success('Solicitud enviada', 'La invitacion quedo pendiente.')
      void queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    },
    onError: (error) => notifySocialError(error, 'No se pudo enviar la solicitud.'),
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success('Solicitud aceptada', 'La persona ya aparece en tus amigos.')
      void queryClient.invalidateQueries({ queryKey: ['friends'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    },
    onError: (error) => notifySocialError(error, 'No se pudo aceptar la solicitud.'),
  })
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      toast.success('Solicitud rechazada', 'La solicitud fue archivada.')
      void queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    },
    onError: (error) => notifySocialError(error, 'No se pudo rechazar la solicitud.'),
  })
}

export function useDeleteFriendship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFriendship,
    onSuccess: () => {
      toast.success('Amigo eliminado', 'La conexión fue quitada de tu cuenta.')
      void queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error) => notifySocialError(error, 'No se pudo eliminar la amistad.'),
  })
}

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => getUserProfile(username ?? ''),
    enabled: Boolean(username),
  })
}

export function useUserStats(username: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => getUserStats(username ?? ''),
    enabled: Boolean(username),
  })
}

export function useUserLists(username: string | undefined) {
  return useQuery({
    queryKey: ['user-lists', username],
    queryFn: () => getUserLists(username ?? '', 1, profilePageSize),
    enabled: Boolean(username),
  })
}

export function useUserListsPages(username: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['user-lists-pages', username],
    queryFn: ({ pageParam }) => getUserLists(username ?? '', pageParam, profilePageSize),
    initialPageParam: 1,
    enabled: Boolean(username),
    getNextPageParam: (lastPage, pages) => (lastPage.length === profilePageSize ? pages.length + 1 : undefined),
  })
}

export function useUserReviews(username: string | undefined) {
  return useQuery({
    queryKey: ['user-reviews', username],
    queryFn: () => getUserReviews(username ?? '', 1, profilePageSize),
    enabled: Boolean(username),
  })
}

export function useUserReviewsPages(username: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['user-reviews-pages', username],
    queryFn: ({ pageParam }) => getUserReviews(username ?? '', pageParam, profilePageSize),
    initialPageParam: 1,
    enabled: Boolean(username),
    getNextPageParam: (lastPage, pages) => (lastPage.length === profilePageSize ? pages.length + 1 : undefined),
  })
}

export function usePublicReviews() {
  return useQuery({ queryKey: ['public-reviews'], queryFn: () => getPublicReviews(1, publicPageSize) })
}

export function usePublicReviewsPages() {
  return useInfiniteQuery({
    queryKey: ['public-reviews-pages'],
    queryFn: ({ pageParam }) => getPublicReviews(pageParam, publicPageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length === publicPageSize ? pages.length + 1 : undefined),
  })
}

export function usePublicLists() {
  return useQuery({ queryKey: ['public-lists'], queryFn: () => getPublicLists(1, publicPageSize) })
}

export function usePublicListsPages() {
  return useInfiniteQuery({
    queryKey: ['public-lists-pages'],
    queryFn: ({ pageParam }) => getPublicLists(pageParam, publicPageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length === publicPageSize ? pages.length + 1 : undefined),
  })
}

export function usePublicListDetails(id: string | undefined) {
  return useQuery({
    queryKey: ['public-list', id],
    queryFn: () => getPublicListDetails(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: () => getFeed(1, publicPageSize) })
}

export function useFeedPages() {
  return useInfiniteQuery({
    queryKey: ['feed-pages'],
    queryFn: ({ pageParam }) => getFeed(pageParam, publicPageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
}

function notifySocialError(error: unknown, fallback: string) {
  toast.error('No se pudo completar la acción social', getErrorMessage(error, fallback))
}
