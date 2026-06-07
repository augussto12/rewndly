import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['friend-requests'] }),
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['friends'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
    },
  })
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['friend-requests'] }),
  })
}

export function useDeleteFriendship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFriendship,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['friends'] }),
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
