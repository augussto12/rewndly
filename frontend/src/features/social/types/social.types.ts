export type Friend = {
  friendshipId: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export type FriendRequest = {
  id: string
  direction: 'Incoming' | 'Outgoing'
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export type UserProfile = {
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  visibility: string
  isOwner: boolean
  isFriend: boolean
  canViewDetails: boolean
}

export type UserStats = {
  username: string
  libraryItems: number
  watched: number
  reviews: number
  lists: number
  friends: number
}

export type PublicReview = {
  id: string
  username: string
  displayName: string
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  mediaTitle: string
  ratingSnapshot: number | null
  title: string
  body: string
  containsSpoilers: boolean
  visibility: string
  createdAt: string
}

export type PublicList = {
  id: string
  username: string
  displayName: string
  title: string
  description: string | null
  visibility: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type PublicListItem = {
  id: string
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  title: string
  posterUrl: string | null
  position: number
  createdAt: string
}

export type PublicListDetails = PublicList & {
  items: PublicListItem[]
}

export type ActivityEvent = {
  id: string
  eventType: string
  username: string
  displayName: string
  avatarUrl: string | null
  mediaType: 'Movie' | 'Series' | null
  tmdbId: number | null
  mediaTitle: string | null
  posterUrl: string | null
  metadataJson: string | null
  createdAt: string
}

export type FeedResponse = {
  items: ActivityEvent[]
  page: number
  pageSize: number
  hasMore: boolean
}
