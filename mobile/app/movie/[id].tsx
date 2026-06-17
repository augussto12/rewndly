import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { getMovieDetails } from '../../src/api/services'
import { LibraryPanel } from '../../src/components/LibraryPanel'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { MediaDetailLayout } from '../../src/components/MediaDetailLayout'
import { Screen } from '../../src/components/Screen'
import { formatRuntime, pickTrailer } from '../../src/lib/mediaFormat'

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const tmdbId = Number(id)
  const details = useQuery({
    queryKey: ['movie', tmdbId],
    queryFn: () => getMovieDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
    staleTime: 1000 * 60 * 5
  })

  if (details.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!details.data) {
    return <Screen><EmptyState title="No encontramos esta pelicula" message="Proba volver e intentar de nuevo." /></Screen>
  }

  const movie = details.data

  return (
    <Screen>
      <MediaDetailLayout
        title={movie.title}
        subtitle={movie.tagline || (movie.originalTitle !== movie.title ? movie.originalTitle : null)}
        backdropUrl={movie.backdropUrl}
        posterUrl={movie.posterUrl}
        metaItems={[
          movie.releaseDate?.slice(0, 4) ?? '',
          formatRuntime(movie.runtimeMinutes),
          movie.voteAverage ? `★ ${movie.voteAverage.toFixed(1)}` : ''
        ]}
        genres={movie.genres}
        overview={movie.overview ?? null}
        trailer={pickTrailer(movie.videos)}
        cast={movie.cast}
        providers={movie.watchProviders}
        externalRatings={movie.externalRatings}
        recommendations={movie.recommendations}
        similar={movie.similar}
        libraryPanel={<LibraryPanel mediaType="Movie" tmdbId={movie.tmdbId} />}
      />
    </Screen>
  )
}
