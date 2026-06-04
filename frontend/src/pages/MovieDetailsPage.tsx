import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsHeader } from '../components/media/MediaDetailsHeader/MediaDetailsHeader'
import { useMovieDetails } from '../features/public-media/hooks/usePublicMedia'
import { MediaActionsPanel } from '../features/user-content/components/MediaActionsPanel'
import { PublicLayout } from '../layouts/PublicLayout'

export function MovieDetailsPage() {
  const tmdbId = Number(useParams().tmdbId)
  const { data, isError, isLoading } = useMovieDetails(tmdbId)

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(tmdbId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la pelicula" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <MediaDetailsHeader
            title={data.title}
            subtitle={data.originalTitle}
            overview={data.overview}
            posterUrl={data.posterUrl}
            backdropUrl={data.backdropUrl}
            voteAverage={data.voteAverage}
            genres={data.genres}
            meta={[data.releaseDate?.slice(0, 4) ?? '', data.runtimeMinutes ? `${data.runtimeMinutes} min` : '']}
          />
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
            <Link to="/movies/search" className="secondary-action">
              Volver a peliculas
            </Link>
          </div>
          <MediaActionsPanel mediaType="Movie" tmdbId={data.tmdbId} title={data.title} />
        </main>
      ) : null}
    </PublicLayout>
  )
}
