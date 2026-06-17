export type MediaSummary = {
  tmdbId: number
  title: string
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  voteAverage: number | null
  genres: string[]
  mediaType: 'Movie' | 'Series'
}

export type PersonSummary = {
  tmdbId: number
  name: string
  knownForDepartment: string | null
  profileUrl: string | null
}

export type PagedResponse<T> = {
  items: T[]
  page: number
  totalPages: number
  totalResults: number
  hasMore: boolean
}

export type DiscoverFilters = {
  genreId?: number
  year?: number
  yearFrom?: number
  yearTo?: number
  watchProviderId?: number
  sortBy?: string
  minVoteAverage?: number
  runtimeMax?: number
}

export type PublicHomeResponse = {
  trendingMovies: MediaSummary[]
  nowPlayingMovies: MediaSummary[]
  popularMovies: MediaSummary[]
  upcomingMovies: MediaSummary[]
  trendingSeries: MediaSummary[]
  popularSeries: MediaSummary[]
  trendingPeople: PersonSummary[]
}

export type ExternalRating = {
  source: string
  label: string
  value: number
  scale: number
  votes: number | null
}

export type RankedMediaSummary = {
  media: MediaSummary
  rank: number
  source: string
  score: number | null
  scoreScale: number | null
}

export type MediaRankingResponse = {
  items: RankedMediaSummary[]
  page: number
  totalPages: number
  totalResults: number
  hasMore: boolean
  rankingKey: string
  source: string
  cachedAt: string | null
  isStale: boolean
}

export type MediaPerson = {
  tmdbId: number
  name: string
  role: string | null
  profileUrl: string | null
}

export type WatchProvider = {
  providerId: number
  name: string
  logoUrl: string | null
  type: string
}

export type MediaVideo = {
  name: string
  key: string
  site: string
  type: string
  official: boolean
}

export type SeasonSummary = {
  tmdbId: number
  seasonNumber: number
  name: string
  overview: string | null
  posterUrl: string | null
  airDate: string | null
  episodeCount: number | null
  voteAverage: number | null
}

export type NetworkSummary = {
  tmdbId: number
  name: string
  logoUrl: string | null
  originCountry: string | null
}

export type WatchProviderOption = {
  providerId: number
  name: string
  logoUrl: string | null
}

export type Genre = {
  tmdbId: number
  name: string
}

export type MovieDetails = {
  tmdbId: number
  title: string
  originalTitle: string | null
  tagline: string | null
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  runtimeMinutes: number | null
  voteAverage: number | null
  genres: string[]
  cast: MediaPerson[]
  videos: MediaVideo[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
  externalRatings: ExternalRating[]
  mediaType: 'Movie'
}

export type SeriesDetails = {
  tmdbId: number
  name: string
  originalName: string | null
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  firstAirDate: string | null
  lastAirDate: string | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  status: string | null
  voteAverage: number | null
  genres: string[]
  cast: MediaPerson[]
  videos: MediaVideo[]
  networks: NetworkSummary[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
  seasons: SeasonSummary[]
  externalRatings: ExternalRating[]
  mediaType: 'Series'
}

export type PersonDetails = PersonSummary & {
  biography: string | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  movieCredits: MediaSummary[]
  tvCredits: MediaSummary[]
}

export type AuthUser = {
  id: string
  username: string
  email: string
  displayName: string
  role: string
  mustChangePassword: boolean
  emailVerifiedAt: string | null
}

export type MobileAuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: AuthUser
  mustChangePassword: boolean
}

export type WatchStatus = 'WantToWatch' | 'Watching' | 'Watched' | 'Dropped'

export type LibraryItemRequest = {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  status: WatchStatus
  isFavorite: boolean
  rating: number | null
  watchedAt: string | null
  startedAt: string | null
}

export type LibraryItem = {
  id: string
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  title: string
  posterUrl: string | null
  status: string
  isFavorite: boolean
  rating: number | null
  createdAt: string
  updatedAt: string
}

export type Visibility = 'Public' | 'FriendsOnly' | 'Private'

export type UserList = {
  id: string
  title: string
  description: string | null
  visibility: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type UserListItem = {
  id: string
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  title: string
  posterUrl: string | null
  rating: number | null
  position: number | null
  note: string | null
  createdAt: string
}

export type UserListDetails = UserList & {
  items: UserListItem[]
}

export type UserListRequest = {
  title: string
  description: string | null
  visibility: Visibility
}

export type Review = {
  id: string
  userId: string
  username: string
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  mediaTitle: string
  posterUrl: string | null
  ratingSnapshot: number | null
  title: string
  body: string
  containsSpoilers: boolean
  visibility: string
  createdAt: string
  updatedAt: string
}
