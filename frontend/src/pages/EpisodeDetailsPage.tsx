import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsExtras } from '../components/media/MediaDetailsExtras/MediaDetailsExtras'
import { MediaDetailsMetadata } from '../components/media/MediaDetailsMetadata/MediaDetailsMetadata'
import { DetailHero } from '../components/media/DetailHero/DetailHero'
import { useEpisodeDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function EpisodeDetailsPage() {
  const seriesTmdbId = Number(useParams().tmdbId)
  const seasonNumber = Number(useParams().seasonNumber)
  const episodeNumber = Number(useParams().episodeNumber)
  const { data, isError, isLoading } = useEpisodeDetails(seriesTmdbId, seasonNumber, episodeNumber)

  return (
    <PublicLayout ambient="detail">
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(seriesTmdbId) || !Number.isFinite(seasonNumber) || !Number.isFinite(episodeNumber) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar el episodio" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <DetailHero
            eyebrow="Episodio"
            title={data.name}
            meta={[
              `T${data.seasonNumber} E${data.episodeNumber}`,
              data.airDate?.slice(0, 10),
              data.runtimeMinutes ? `${data.runtimeMinutes} min` : undefined,
            ]}
            voteAverage={data.voteAverage}
            backdropUrl={data.stillUrl}
            backHref={`/series/${data.seriesTmdbId}/seasons/${data.seasonNumber}`}
            actions={
              <Link to={`/series/${data.seriesTmdbId}`} className="secondary-action">
                Ver serie
              </Link>
            }
          >
            <p className="text-base leading-7 text-[var(--color-text-secondary)]">
              {data.overview || 'Todavía no hay sinopsis disponible para este episodio.'}
            </p>
          </DetailHero>

          {data.crew.length > 0 ? (
            <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
              <div className="mb-4">
                <p className="kicker">Equipo</p>
                <h2 className="mt-2 text-2xl font-semibold">Créditos destacados</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.crew.map((member) => (
                  <div key={`${member.tmdbId}-${member.job}`} className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-4">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {[member.job, member.department].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <MediaDetailsExtras mediaTitle={data.name} cast={data.cast} videos={data.videos} watchProviders={[]} recommendations={[]} similar={[]} />
          <MediaDetailsMetadata
            images={data.images}
            keywords={[]}
            reviews={[]}
            externalLinks={data.externalLinks}
            alternativeTitles={[]}
            translations={data.translations}
          />
        </main>
      ) : null}
    </PublicLayout>
  )
}
