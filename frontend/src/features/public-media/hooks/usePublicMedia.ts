import { useQuery } from '@tanstack/react-query'
import {
  getMovieDetails,
  getPublicHome,
  getSeriesDetails,
  searchMovies,
  searchSeries,
} from '../services/publicMediaApi'

export function usePublicHome() {
  return useQuery({
    queryKey: ['public-home'],
    queryFn: getPublicHome,
  })
}

export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ['movies-search', query],
    queryFn: () => searchMovies(query),
    enabled: query.trim().length >= 2,
  })
}

export function useSeriesSearch(query: string) {
  return useQuery({
    queryKey: ['series-search', query],
    queryFn: () => searchSeries(query),
    enabled: query.trim().length >= 2,
  })
}

export function useMovieDetails(tmdbId: number) {
  return useQuery({
    queryKey: ['movie-details', tmdbId],
    queryFn: () => getMovieDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}

export function useSeriesDetails(tmdbId: number) {
  return useQuery({
    queryKey: ['series-details', tmdbId],
    queryFn: () => getSeriesDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
  })
}
