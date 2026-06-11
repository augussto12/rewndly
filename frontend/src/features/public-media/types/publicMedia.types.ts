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

export type PagedResponse<TItem> = {
  items: TItem[]
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
  homepage: string | null
  collection: CollectionSummary | null
  productionCompanies: CompanySummary[]
  cast: MediaPerson[]
  crew: MediaCrew[]
  videos: MediaVideo[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
  images: MediaImage[]
  keywords: MediaKeyword[]
  tmdbReviews: MediaReview[]
  externalLinks: MediaExternalLink[]
  alternativeTitles: MediaAlternativeTitle[]
  translations: MediaTranslation[]
  releaseInfo: MovieReleaseInfo[]
  externalRatings: ExternalRating[]
  ratingsCachedAt: string | null
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
  homepage: string | null
  productionCompanies: CompanySummary[]
  networks: NetworkSummary[]
  cast: MediaPerson[]
  crew: MediaCrew[]
  videos: MediaVideo[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
  images: MediaImage[]
  keywords: MediaKeyword[]
  tmdbReviews: MediaReview[]
  externalLinks: MediaExternalLink[]
  alternativeTitles: MediaAlternativeTitle[]
  translations: MediaTranslation[]
  contentRatings: SeriesContentRating[]
  seasons: SeasonSummary[]
  externalRatings: ExternalRating[]
  ratingsCachedAt: string | null
  mediaType: 'Series'
}

export type ExternalRating = {
  source: string
  label: string
  value: number
  scale: number
  votes: number | null
}

export type ExternalRatingsBatchItem = {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  ratings: ExternalRating[]
  cachedAt: string | null
}

export type WatchProvidersBatchItem = {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  providers: WatchProvider[]
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

export type MediaCrew = {
  tmdbId: number
  name: string
  job: string | null
  department: string | null
  profileUrl: string | null
}

export type MediaVideo = {
  name: string
  key: string
  site: string
  type: string
  official: boolean
}

export type WatchProvider = {
  providerId: number
  name: string
  logoUrl: string | null
  type: string
}

export type MediaImage = {
  url: string
  width: number | null
  height: number | null
  type: string
}

export type MediaKeyword = {
  tmdbId: number
  name: string
}

export type CollectionSummary = {
  tmdbId: number
  name: string
  posterUrl: string | null
  backdropUrl: string | null
}

export type CollectionDetails = {
  tmdbId: number
  name: string
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  parts: MediaSummary[]
  images: MediaImage[]
  translations: MediaTranslation[]
}

export type CompanySummary = {
  tmdbId: number
  name: string
  logoUrl: string | null
  originCountry: string | null
}

export type CompanyDetails = {
  tmdbId: number
  name: string
  description: string | null
  headquarters: string | null
  homepage: string | null
  logoUrl: string | null
  originCountry: string | null
  parentCompany: CompanySummary | null
  alternativeNames: EntityAlias[]
  images: MediaImage[]
  movies: MediaSummary[]
  series: MediaSummary[]
}

export type NetworkSummary = {
  tmdbId: number
  name: string
  logoUrl: string | null
  originCountry: string | null
}

export type NetworkDetails = {
  tmdbId: number
  name: string
  headquarters: string | null
  homepage: string | null
  logoUrl: string | null
  originCountry: string | null
  alternativeNames: EntityAlias[]
  images: MediaImage[]
  series: MediaSummary[]
}

export type EntityAlias = {
  name: string
  type: string | null
}

export type KeywordDetails = {
  tmdbId: number
  name: string
  movies: MediaSummary[]
  series: MediaSummary[]
}

export type MediaReview = {
  id: string
  author: string
  username: string | null
  avatarUrl: string | null
  rating: number | null
  content: string
  createdAt: string | null
  url: string | null
}

export type MediaExternalLink = {
  site: string
  id: string
  url: string
}

export type MediaAlternativeTitle = {
  title: string
  country: string | null
  type: string | null
}

export type MediaTranslation = {
  languageCode: string
  countryCode: string | null
  englishName: string | null
  name: string | null
}

export type MovieReleaseInfo = {
  country: string
  certification: string | null
  releaseDate: string | null
  type: number | null
}

export type SeriesContentRating = {
  country: string
  rating: string
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

export type SeasonDetails = {
  tmdbId: number
  seriesTmdbId: number
  seasonNumber: number
  name: string
  overview: string | null
  posterUrl: string | null
  airDate: string | null
  voteAverage: number | null
  episodes: EpisodeSummary[]
  cast: MediaPerson[]
  crew: MediaCrew[]
  videos: MediaVideo[]
  watchProviders: WatchProvider[]
  images: MediaImage[]
  externalLinks: MediaExternalLink[]
  translations: MediaTranslation[]
}

export type EpisodeSummary = {
  tmdbId: number
  episodeNumber: number
  seasonNumber: number
  name: string
  overview: string | null
  stillUrl: string | null
  airDate: string | null
  runtimeMinutes: number | null
  voteAverage: number | null
}

export type EpisodeDetails = {
  tmdbId: number
  seriesTmdbId: number
  seasonNumber: number
  episodeNumber: number
  name: string
  overview: string | null
  stillUrl: string | null
  airDate: string | null
  runtimeMinutes: number | null
  voteAverage: number | null
  cast: MediaPerson[]
  crew: MediaCrew[]
  videos: MediaVideo[]
  images: MediaImage[]
  externalLinks: MediaExternalLink[]
  translations: MediaTranslation[]
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

export type DiscoverFilters = {
  mediaType: 'Movie' | 'Series'
  genreId?: number
  year?: number
  yearFrom?: number
  yearTo?: number
  watchProviderId?: number
  sortBy?: string
  minVoteAverage?: number
  runtimeMax?: number
}

export type PersonSummary = {
  tmdbId: number
  name: string
  knownForDepartment: string | null
  profileUrl: string | null
  popularity: number | null
  knownFor: MediaSummary[]
}

export type PersonDetails = {
  tmdbId: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  knownForDepartment: string | null
  profileUrl: string | null
  homepage: string | null
  imdbId: string | null
  combinedCredits: MediaSummary[]
  movieCredits: MediaSummary[]
  tvCredits: MediaSummary[]
  images: PersonImage[]
  taggedImages: PersonTaggedImage[]
  externalLinks: MediaExternalLink[]
  translations: MediaTranslation[]
}

export type PersonImage = {
  url: string
  width: number | null
  height: number | null
}

export type PersonTaggedImage = {
  url: string
  width: number | null
  height: number | null
  media: MediaSummary | null
}
