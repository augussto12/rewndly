import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsExtras } from '../components/media/MediaDetailsExtras/MediaDetailsExtras'
import { MediaDetailsHeader } from '../components/media/MediaDetailsHeader/MediaDetailsHeader'
import { MediaDetailsMetadata } from '../components/media/MediaDetailsMetadata/MediaDetailsMetadata'
import { MediaEntityLinks } from '../components/media/MediaEntityLinks/MediaEntityLinks'
import { SeriesSeasonsSection } from '../components/media/SeriesSeasonsSection/SeriesSeasonsSection'
import { useSeriesDetails } from '../features/public-media/hooks/usePublicMedia'
import { MediaActionsPanel } from '../features/user-content/components/MediaActionsPanel'
import { PublicLayout } from '../layouts/PublicLayout'

export function SeriesDetailsPage() {
  const tmdbId = Number(useParams().tmdbId)
  const { data, isError, isLoading } = useSeriesDetails(tmdbId)

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(tmdbId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la serie" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <MediaDetailsHeader
            title={data.name}
            subtitle={data.originalName}
            overview={data.overview}
            posterUrl={data.posterUrl}
            backdropUrl={data.backdropUrl}
            voteAverage={data.voteAverage}
            genres={data.genres}
            meta={[
              data.firstAirDate?.slice(0, 4) ?? '',
              data.numberOfSeasons ? `${data.numberOfSeasons} temporadas` : '',
              data.numberOfEpisodes ? `${data.numberOfEpisodes} episodios` : '',
              data.status ?? '',
            ]}
          />
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
            <Link to="/series/search" className="secondary-action">
              Volver a series
            </Link>
          </div>
          <MediaEntityLinks companies={data.productionCompanies} networks={data.networks} />
          <SeriesSeasonsSection seriesTmdbId={data.tmdbId} seasons={data.seasons} />
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
            contentRatings={data.contentRatings}
          />
          <MediaActionsPanel mediaType="Series" tmdbId={data.tmdbId} title={data.name} />
        </main>
      ) : null}
    </PublicLayout>
  )
}
