import { useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsExtras } from '../components/media/MediaDetailsExtras/MediaDetailsExtras'
import { MediaDetailsHeader } from '../components/media/MediaDetailsHeader/MediaDetailsHeader'
import { MediaDetailsMetadata } from '../components/media/MediaDetailsMetadata/MediaDetailsMetadata'
import { MediaEntityLinks } from '../components/media/MediaEntityLinks/MediaEntityLinks'
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
            subtitle={data.tagline || data.originalTitle}
            overview={data.overview}
            posterUrl={data.posterUrl}
            backdropUrl={data.backdropUrl}
            voteAverage={data.voteAverage}
            genres={data.genres}
            meta={[data.releaseDate?.slice(0, 4) ?? '', data.runtimeMinutes ? `${data.runtimeMinutes} min` : '']}
            backHref="/movies/search"
            backLabel="Volver a peliculas"
          />
          <MediaActionsPanel mediaType="Movie" tmdbId={data.tmdbId} title={data.title} />
          <MediaEntityLinks collection={data.collection} companies={data.productionCompanies} />
          <MediaDetailsExtras
            cast={data.cast}
            videos={data.videos}
            watchProviders={data.watchProviders}
            recommendations={data.recommendations}
            similar={data.similar}
          />
          <MediaDetailsMetadata
            images={data.images}
            keywords={data.keywords}
            reviews={data.tmdbReviews}
            externalLinks={data.externalLinks}
            alternativeTitles={data.alternativeTitles}
            translations={data.translations}
            releaseInfo={data.releaseInfo}
          />
        </main>
      ) : null}
    </PublicLayout>
  )
}
