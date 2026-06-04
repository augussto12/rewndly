import { httpClient } from '../../../services/httpClient'
import type {
  LibraryItem,
  LibraryItemRequest,
  Review,
  ReviewRequest,
  UserList,
  UserListDetails,
  UserListItem,
  UserListItemRequest,
  UserListRequest,
} from '../types/userContent.types'

export function getMyLibrary() {
  return httpClient<LibraryItem[]>('/api/me/library')
}

export function createLibraryItem(request: LibraryItemRequest) {
  return httpClient<LibraryItem>('/api/me/library/items', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function updateLibraryItem(id: string, request: LibraryItemRequest) {
  return httpClient<LibraryItem>(`/api/me/library/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function deleteLibraryItem(id: string) {
  return httpClient<void>(`/api/me/library/items/${id}`, {
    method: 'DELETE',
  })
}

export function getMediaReviews(mediaType: string, tmdbId: number) {
  return httpClient<Review[]>(`/api/reviews/media/${mediaType}/${tmdbId}`)
}

export function getMyReviews() {
  return httpClient<Review[]>('/api/me/reviews')
}

export function createReview(request: ReviewRequest) {
  return httpClient<Review>('/api/me/reviews', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function updateReview(id: string, request: ReviewRequest) {
  return httpClient<Review>(`/api/me/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function deleteReview(id: string) {
  return httpClient<void>(`/api/me/reviews/${id}`, {
    method: 'DELETE',
  })
}

export function getMyLists() {
  return httpClient<UserList[]>('/api/me/lists')
}

export function createList(request: UserListRequest) {
  return httpClient<UserList>('/api/me/lists', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function getListDetails(id: string) {
  return httpClient<UserListDetails>(`/api/me/lists/${id}`)
}

export function updateList(id: string, request: UserListRequest) {
  return httpClient<UserList>(`/api/me/lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function deleteList(id: string) {
  return httpClient<void>(`/api/me/lists/${id}`, {
    method: 'DELETE',
  })
}

export function addListItem(id: string, request: UserListItemRequest) {
  return httpClient<UserListItem>(`/api/me/lists/${id}/items`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function deleteListItem(listId: string, itemId: string) {
  return httpClient<void>(`/api/me/lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
  })
}
