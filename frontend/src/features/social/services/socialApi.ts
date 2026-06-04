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

export function getUserLists(username: string) {
  return httpClient<PublicList[]>(`/api/users/${encodeURIComponent(username)}/lists?page=1&pageSize=24`)
}

export function getUserReviews(username: string) {
  return httpClient<PublicReview[]>(`/api/users/${encodeURIComponent(username)}/reviews?page=1&pageSize=24`)
}

export function getPublicReviews() {
  return httpClient<PublicReview[]>('/api/reviews/public?page=1&pageSize=30')
}

export function getPublicLists() {
  return httpClient<PublicList[]>('/api/lists/public?page=1&pageSize=30')
}

export function getPublicListDetails(id: string) {
  return httpClient<PublicListDetails>(`/api/lists/${id}`)
}

export function getFeed() {
  return httpClient<FeedResponse>('/api/feed?page=1&pageSize=30')
}
