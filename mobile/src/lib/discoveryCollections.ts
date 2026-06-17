import type { DiscoverFilters } from '../api/types'

const genre = {
  comedy: 35,
  horror: 27,
  scifi: 878,
  thriller: 53,
  animation: 16
}

export type MoodCollection = {
  value: string
  label: string
  description: string
  mediaType: 'Movie' | 'Series'
  filters: DiscoverFilters
}

export const exploreMoods: MoodCollection[] = [
  {
    value: 'intense',
    label: 'Intensa',
    description: 'Historias con tension y pulso alto.',
    mediaType: 'Movie',
    filters: { genreId: genre.thriller, sortBy: 'vote_average.desc', minVoteAverage: 7 }
  },
  {
    value: 'light',
    label: 'Liviana',
    description: 'Opciones livianas para ver sin compromiso.',
    mediaType: 'Movie',
    filters: { genreId: genre.comedy, sortBy: 'popularity.desc', minVoteAverage: 6.4, runtimeMax: 105 }
  },
  {
    value: 'weird',
    label: 'Rara',
    description: 'Ciencia ficcion y vueltas distintas.',
    mediaType: 'Movie',
    filters: { genreId: genre.scifi, sortBy: 'vote_average.desc', minVoteAverage: 6.8 }
  },
  {
    value: 'classic',
    label: 'Clasica',
    description: 'Clasicos para ir a lo seguro.',
    mediaType: 'Movie',
    filters: { sortBy: 'vote_average.desc', minVoteAverage: 7.5, yearTo: 1999 }
  },
  {
    value: 'short',
    label: 'Corta',
    description: 'Peliculas cortas, sin maraton.',
    mediaType: 'Movie',
    filters: { sortBy: 'popularity.desc', minVoteAverage: 6.5, runtimeMax: 95 }
  },
  {
    value: 'acclaimed',
    label: 'Aclamada',
    description: 'Titulos con rating alto.',
    mediaType: 'Movie',
    filters: { sortBy: 'vote_average.desc', minVoteAverage: 7.8 }
  }
]

export const gemsFilters: DiscoverFilters = { sortBy: 'vote_average.desc', minVoteAverage: 7.1, yearFrom: 2010 }
export const classicsFilters: DiscoverFilters = { sortBy: 'vote_average.desc', minVoteAverage: 7.4, yearTo: 1999 }
