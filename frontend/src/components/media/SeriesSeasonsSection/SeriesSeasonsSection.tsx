import { Link } from 'react-router-dom'
import type { SeasonSummary } from '../../../features/public-media/types/publicMedia.types'

type SeriesSeasonsSectionProps = {
  seriesTmdbId: number
  seasons: SeasonSummary[]
}

export function SeriesSeasonsSection({ seriesTmdbId, seasons }: SeriesSeasonsSectionProps) {
  if (seasons.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div className="mb-5">
        <p className="kicker">Temporadas</p>
        <h2 className="mt-2 text-2xl font-semibold">Guia de episodios</h2>
      </div>
      <div className="scrollbar-cinema flex gap-4 overflow-x-auto pb-4">
        {seasons.map((season) => (
          <Link
            key={season.tmdbId}
            to={`/series/${seriesTmdbId}/seasons/${season.seasonNumber}`}
            className="group block min-w-[11rem] max-w-[11rem] rounded-[var(--radius-md)]"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition group-hover:-translate-y-1 group-hover:border-violet-200/28">
              {season.posterUrl ? (
                <img src={season.posterUrl} alt={season.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" loading="lazy" />
              ) : (
                <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">
                  Sin poster
                </div>
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{season.name}</h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {[season.airDate?.slice(0, 4), season.episodeCount ? `${season.episodeCount} episodios` : ''].filter(Boolean).join(' / ')}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
