import { httpClient } from '../../../services/httpClient'
import type {
  FeedResponse,
  Friend,
  FriendRequest,
  PublicList,
  PublicListDetails,
  PublicReview,
  UserProfile,
  UserStats,
} from '../types/social.types'

export function getFriends() {
  return httpClient<Friend[]>('/api/friends')
}

export function getFriendRequests() {
  return httpClient<FriendRequest[]>('/api/friends/requests')
}

export function sendFriendRequest(username: string) {
  return httpClient<FriendRequest>('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}

export function acceptFriendRequest(id: string) {
  return httpClient<Friend>(`/api/friends/requests/${id}/accept`, {
    method: 'POST',
  })
}

export function rejectFriendRequest(id: string) {
  return httpClient<void>(`/api/friends/requests/${id}/reject`, {
    method: 'POST',
  })
}

export function deleteFriendship(id: string) {
  return httpClient<void>(`/api/friends/${id}`, {
    method: 'DELETE',
  })
}

export function getUserProfile(username: string) {
  return httpClient<UserProfile>(`/api/users/${encodeURIComponent(username)}`)
}

export function getUserStats(username: string) {
  return httpClient<UserStats>(`/api/users/${encodeURIComponent(username)}/stats`)
}

export function getUserLists(username: string, page = 1, pageSize = 24) {
  return httpClient<PublicList[]>(`/api/users/${encodeURIComponent(username)}/lists?page=${page}&pageSize=${pageSize}`)
}

export function getUserReviews(username: string, page = 1, pageSize = 24) {
  return httpClient<PublicReview[]>(`/api/users/${encodeURIComponent(username)}/reviews?page=${page}&pageSize=${pageSize}`)
}

export function getPublicReviews(page = 1, pageSize = 30) {
  return httpClient<PublicReview[]>(`/api/reviews/public?page=${page}&pageSize=${pageSize}`)
}

export function getPublicLists(page = 1, pageSize = 30) {
  return httpClient<PublicList[]>(`/api/lists/public?page=${page}&pageSize=${pageSize}`)
}

export function getPublicListDetails(id: string) {
  return httpClient<PublicListDetails>(`/api/lists/${id}`)
}

export function getFeed(page = 1, pageSize = 30) {
  return httpClient<FeedResponse>(`/api/feed?page=${page}&pageSize=${pageSize}`)
}
