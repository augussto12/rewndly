import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaDetailsExtras } from '../components/media/MediaDetailsExtras/MediaDetailsExtras'
import { MediaDetailsMetadata } from '../components/media/MediaDetailsMetadata/MediaDetailsMetadata'
import { RatingBadge } from '../components/media/RatingBadge/RatingBadge'
import { BackButton } from '../components/navigation/BackButton'
import { useSeasonDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function SeasonDetailsPage() {
  const seriesTmdbId = Number(useParams().tmdbId)
  const seasonNumber = Number(useParams().seasonNumber)
  const { data, isError, isLoading } = useSeasonDetails(seriesTmdbId, seasonNumber)

  return (
    <PublicLayout ambient="detail">
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(seriesTmdbId) || !Number.isFinite(seasonNumber) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la temporada" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[14rem_1fr] md:py-16">
            <div className="w-44 md:w-full">
              <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/[0.12] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)]">
                {data.posterUrl ? (
                  <img src={data.posterUrl} alt={data.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-[var(--color-text-secondary)]">Sin póster</div>
                )}
              </div>
            </div>
            <div className="self-end">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <RatingBadge value={data.voteAverage} />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {[data.airDate?.slice(0, 4), `${data.episodes.length} episodios`].filter(Boolean).join(' / ')}
                </span>
              </div>
              <p className="kicker">Temporada {data.seasonNumber}</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{data.name}</h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                {data.overview || 'Todavía no hay sinopsis disponible para esta temporada.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BackButton fallbackHref={`/series/${data.seriesTmdbId}`} />
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
            <div className="mb-5">
              <p className="kicker">Episodios</p>
              <h2 className="mt-2 text-2xl font-semibold">Temporada {data.seasonNumber}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.episodes.map((episode) => (
                <Link
                  key={episode.tmdbId}
                  to={`/series/${data.seriesTmdbId}/seasons/${data.seasonNumber}/episodes/${episode.episodeNumber}`}
                  className="group grid gap-4 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-3 transition hover:-translate-y-1 hover:border-violet-200/28 sm:grid-cols-[10rem_1fr]"
                >
                  <div className="aspect-video overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)]">
                    {episode.stillUrl ? (
                      <img src={episode.stillUrl} alt={episode.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" loading="lazy" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-[var(--color-text-secondary)]">Sin imagen</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span>E{episode.episodeNumber}</span>
                      {episode.airDate ? <span>{episode.airDate.slice(0, 10)}</span> : null}
                      {episode.runtimeMinutes ? <span>{episode.runtimeMinutes} min</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-semibold">{episode.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {episode.overview || 'Sin sinopsis disponible.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <MediaDetailsExtras
            mediaTitle={data.name}
            cast={data.cast}
            videos={data.videos}
            watchProviders={data.watchProviders}
            recommendations={[]}
            similar={[]}
          />
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
