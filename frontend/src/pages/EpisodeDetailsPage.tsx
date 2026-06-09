import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsExtras } from '../components/media/MediaDetailsExtras/MediaDetailsExtras'
import { MediaDetailsMetadata } from '../components/media/MediaDetailsMetadata/MediaDetailsMetadata'
import { RatingBadge } from '../components/media/RatingBadge/RatingBadge'
import { BackButton } from '../components/navigation/BackButton'
import { useEpisodeDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function EpisodeDetailsPage() {
  const seriesTmdbId = Number(useParams().tmdbId)
  const seasonNumber = Number(useParams().seasonNumber)
  const episodeNumber = Number(useParams().episodeNumber)
  const { data, isError, isLoading } = useEpisodeDetails(seriesTmdbId, seasonNumber, episodeNumber)

  return (
    <PublicLayout>
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
          <section className="relative overflow-hidden">
            {data.stillUrl ? <img src={data.stillUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.72)_0%,rgba(9,9,11,0.94)_64%,#09090b_100%)] backdrop-blur-[2px]" />
            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
              <div className="max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <RatingBadge value={data.voteAverage} />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {[
                      `T${data.seasonNumber} E${data.episodeNumber}`,
                      data.airDate?.slice(0, 10),
                      data.runtimeMinutes ? `${data.runtimeMinutes} min` : '',
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  </span>
                </div>
                <p className="kicker">Episodio</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
                <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                  {data.overview || 'Todavia no hay sinopsis disponible para este episodio.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <BackButton fallbackHref={`/series/${data.seriesTmdbId}/seasons/${data.seasonNumber}`} />
                  <Link to={`/series/${data.seriesTmdbId}`} className="secondary-action">
                    Ver serie
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {data.crew.length > 0 ? (
            <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
              <div className="mb-4">
                <p className="kicker">Equipo</p>
                <h2 className="mt-2 text-2xl font-semibold">Creditos destacados</h2>
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
