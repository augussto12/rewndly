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

export type MovieDetails = {
  tmdbId: number
  title: string
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  runtimeMinutes: number | null
  voteAverage: number | null
  genres: string[]
  cast: MediaPerson[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  externalRatings: ExternalRating[]
  mediaType: 'Movie'
}

export type SeriesDetails = {
  tmdbId: number
  name: string
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  firstAirDate: string | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  voteAverage: number | null
  genres: string[]
  cast: MediaPerson[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  externalRatings: ExternalRating[]
  mediaType: 'Series'
}

export type PersonDetails = PersonSummary & {
  biography: string | null
  birthday: string | null
  placeOfBirth: string | null
  movieCredits: MediaSummary[]
  seriesCredits: MediaSummary[]
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

export type UserList = {
  id: string
  title: string
  description: string | null
  visibility: string
  itemCount: number
  createdAt: string
  updatedAt: string
}
