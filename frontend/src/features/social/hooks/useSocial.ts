import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    queryFn: () => getUserLists(username ?? ''),
    enabled: Boolean(username),
  })
}

export function useUserReviews(username: string | undefined) {
  return useQuery({
    queryKey: ['user-reviews', username],
    queryFn: () => getUserReviews(username ?? ''),
    enabled: Boolean(username),
  })
}

export function usePublicReviews() {
  return useQuery({ queryKey: ['public-reviews'], queryFn: getPublicReviews })
}

export function usePublicLists() {
  return useQuery({ queryKey: ['public-lists'], queryFn: getPublicLists })
}

export function usePublicListDetails(id: string | undefined) {
  return useQuery({
    queryKey: ['public-list', id],
    queryFn: () => getPublicListDetails(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: getFeed })
}
