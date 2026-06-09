import type { DiscoverFilters } from '../types/publicMedia.types'
import type { ExternalRankingKey, MovieBrowseCategory, SeriesBrowseCategory } from '../hooks/usePublicMedia'

export type MovieDiscoveryView =
  | MovieBrowseCategory
  | 'top-imdb'
  | 'top-critics'
  | 'audience'
  | 'gems'
  | 'classics'
  | 'horror'
  | 'scifi'
  | 'animation'

export type SeriesDiscoveryView =
  | SeriesBrowseCategory
  | 'top-imdb'
  | 'top-critics'
  | 'audience'
  | 'binge'
  | 'new'
  | 'classics'

export type DiscoveryKind = 'browse' | 'ranking' | 'discover'

export type MovieDiscoveryCollection = {
  value: MovieDiscoveryView
  label: string
  kind: DiscoveryKind
  browseCategory?: MovieBrowseCategory
  rankingKey?: ExternalRankingKey
  filters?: DiscoverFilters
}

export type SeriesDiscoveryCollection = {
  value: SeriesDiscoveryView
  label: string
  kind: DiscoveryKind
  browseCategory?: SeriesBrowseCategory
  rankingKey?: ExternalRankingKey
  filters?: DiscoverFilters
}

const genre = {
  movie: {
    animation: 16,
    comedy: 35,
    horror: 27,
    scifi: 878,
    thriller: 53,
  },
  series: {
    animation: 16,
    comedy: 35,
    drama: 18,
    scifiFantasy: 10765,
  },
}

export const movieDiscoveryCollections: MovieDiscoveryCollection[] = [
  { value: 'popular', label: 'Populares', kind: 'browse', browseCategory: 'popular' },
  { value: 'trending', label: 'Tendencia', kind: 'browse', browseCategory: 'trending' },
  { value: 'top-imdb', label: 'Mejor IMDb', kind: 'ranking', rankingKey: 'imdb' },
  { value: 'top-critics', label: 'Critica', kind: 'ranking', rankingKey: 'critics' },
  {
    value: 'audience',
    label: 'Audiencia',
    kind: 'discover',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.6 },
  },
  {
    value: 'gems',
    label: 'Joyas',
    kind: 'discover',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.1, yearFrom: 2010 },
  },
  {
    value: 'classics',
    label: 'Clasicos',
    kind: 'discover',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.4, yearTo: 1999 },
  },
  {
    value: 'horror',
    label: 'Terror',
    kind: 'discover',
    filters: { mediaType: 'Movie', genreId: genre.movie.horror, sortBy: 'vote_average.desc', minVoteAverage: 6.5 },
  },
  {
    value: 'scifi',
    label: 'Ciencia ficcion',
    kind: 'discover',
    filters: { mediaType: 'Movie', genreId: genre.movie.scifi, sortBy: 'vote_average.desc', minVoteAverage: 6.8 },
  },
  {
    value: 'animation',
    label: 'Animacion',
    kind: 'discover',
    filters: { mediaType: 'Movie', genreId: genre.movie.animation, sortBy: 'vote_average.desc', minVoteAverage: 7 },
  },
]

export const seriesDiscoveryCollections: SeriesDiscoveryCollection[] = [
  { value: 'popular', label: 'Populares', kind: 'browse', browseCategory: 'popular' },
  { value: 'trending', label: 'Tendencia', kind: 'browse', browseCategory: 'trending' },
  { value: 'top-imdb', label: 'Mejor IMDb', kind: 'ranking', rankingKey: 'imdb' },
  { value: 'top-critics', label: 'Critica', kind: 'ranking', rankingKey: 'critics' },
  {
    value: 'audience',
    label: 'Audiencia',
    kind: 'discover',
    filters: { mediaType: 'Series', sortBy: 'vote_average.desc', minVoteAverage: 7.8 },
  },
  {
    value: 'binge',
    label: 'Para maratonear',
    kind: 'discover',
    filters: { mediaType: 'Series', sortBy: 'vote_average.desc', minVoteAverage: 7.7 },
  },
  {
    value: 'new',
    label: 'Nuevas',
    kind: 'discover',
    filters: { mediaType: 'Series', sortBy: 'first_air_date.desc', yearFrom: 2020, minVoteAverage: 7 },
  },
  {
    value: 'classics',
    label: 'Clasicos',
    kind: 'discover',
    filters: { mediaType: 'Series', sortBy: 'vote_average.desc', minVoteAverage: 7.6, yearTo: 2005 },
  },
]

export const exploreMoodCollections: Array<{
  value: string
  label: string
  filters: DiscoverFilters
}> = [
  {
    value: 'intense',
    label: 'Intensa',
    filters: { mediaType: 'Movie', genreId: genre.movie.thriller, sortBy: 'vote_average.desc', minVoteAverage: 7 },
  },
  {
    value: 'light',
    label: 'Liviana',
    filters: { mediaType: 'Movie', genreId: genre.movie.comedy, sortBy: 'popularity.desc', minVoteAverage: 6.4, runtimeMax: 105 },
  },
  {
    value: 'weird',
    label: 'Rara',
    filters: { mediaType: 'Movie', genreId: genre.movie.scifi, sortBy: 'vote_average.desc', minVoteAverage: 6.8 },
  },
  {
    value: 'classic',
    label: 'Clasica',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.5, yearTo: 1999 },
  },
  {
    value: 'short',
    label: 'Corta',
    filters: { mediaType: 'Movie', sortBy: 'popularity.desc', minVoteAverage: 6.5, runtimeMax: 95 },
  },
  {
    value: 'acclaimed',
    label: 'Aclamada',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.8 },
  },
]

export const gameModeCollections: Array<{
  value: 'popular' | 'classics' | 'imdb8' | 'horror' | 'animation' | 'series'
  label: string
  mediaType: 'Movie' | 'Series'
  rankingKey?: ExternalRankingKey
  filters?: DiscoverFilters
  browseCategory?: MovieBrowseCategory | SeriesBrowseCategory
}> = [
  { value: 'popular', label: 'Popular', mediaType: 'Movie', browseCategory: 'popular' },
  {
    value: 'classics',
    label: 'Clasicos',
    mediaType: 'Movie',
    filters: { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7.4, yearTo: 1999 },
  },
  { value: 'imdb8', label: 'IMDb 8+', mediaType: 'Movie', rankingKey: 'imdb' },
  {
    value: 'horror',
    label: 'Terror',
    mediaType: 'Movie',
    filters: { mediaType: 'Movie', genreId: genre.movie.horror, sortBy: 'vote_average.desc', minVoteAverage: 6.5 },
  },
  {
    value: 'animation',
    label: 'Animacion',
    mediaType: 'Movie',
    filters: { mediaType: 'Movie', genreId: genre.movie.animation, sortBy: 'vote_average.desc', minVoteAverage: 7 },
  },
  { value: 'series', label: 'Series', mediaType: 'Series', rankingKey: 'imdb' },
]

export function getMovieDiscoveryCollection(value: string | null) {
  return movieDiscoveryCollections.find((collection) => collection.value === value) ?? movieDiscoveryCollections[0]
}

export function getSeriesDiscoveryCollection(value: string | null) {
  return seriesDiscoveryCollections.find((collection) => collection.value === value) ?? seriesDiscoveryCollections[0]
}
