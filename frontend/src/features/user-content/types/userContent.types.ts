export type MediaKind = 'Movie' | 'Series'

export type WatchStatus = 'WantToWatch' | 'Watching' | 'Watched' | 'Dropped'

export type Visibility = 'Public' | 'FriendsOnly' | 'Private'

export type LibraryItemRequest = {
  mediaType: MediaKind
  tmdbId: number
  status: WatchStatus
  isFavorite: boolean
  rating: number | null
  watchedAt: string | null
  startedAt: string | null
}

export type LibraryItem = LibraryItemRequest & {
  id: string
  title: string
  posterUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ReviewRequest = {
  mediaType: MediaKind
  tmdbId: number
  ratingSnapshot: number | null
  title: string
  body: string
  containsSpoilers: boolean
  visibility: Visibility
}

export type Review = ReviewRequest & {
  id: string
  userId: string
  username: string
  mediaTitle: string
  createdAt: string
  updatedAt: string
}

export type UserListRequest = {
  title: string
  description: string | null
  visibility: Visibility
}

export type UserList = UserListRequest & {
  id: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type UserListItemRequest = {
  mediaType: MediaKind
  tmdbId: number
  position: number | null
  note: string | null
}

export type UserListItem = UserListItemRequest & {
  id: string
  title: string
  posterUrl: string | null
  rating: number | null
  createdAt: string
}

export type UserListDetails = UserList & {
  items: UserListItem[]
}
