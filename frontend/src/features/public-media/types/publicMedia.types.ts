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

export type PublicHomeResponse = {
  trendingMovies: MediaSummary[]
  popularMovies: MediaSummary[]
  upcomingMovies: MediaSummary[]
  trendingSeries: MediaSummary[]
  popularSeries: MediaSummary[]
}

export type MovieDetails = {
  tmdbId: number
  title: string
  originalTitle: string | null
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  runtimeMinutes: number | null
  voteAverage: number | null
  genres: string[]
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
  voteAverage: number | null
  genres: string[]
  mediaType: 'Series'
}
