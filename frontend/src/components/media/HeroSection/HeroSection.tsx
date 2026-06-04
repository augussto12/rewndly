import { Link } from 'react-router-dom'
import { RatingBadge } from '../RatingBadge/RatingBadge'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'

type HeroSectionProps = {
  item: MediaSummary
}

export function HeroSection({ item }: HeroSectionProps) {
  const href = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`

  return (
    <section className="relative min-h-[72svh] overflow-hidden">
      {item.backdropUrl ? (
        <img src={item.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-48" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#09090b_0%,rgba(9,9,11,0.88)_36%,rgba(9,9,11,0.36)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_26%,rgba(124,58,237,0.2),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
      <div className="relative mx-auto flex min-h-[72svh] max-w-7xl items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-18">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-[var(--radius-sm)] border border-violet-200/20 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-100">
              Tendencia
            </span>
            <RatingBadge value={item.voteAverage} />
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}
            </span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">{item.title}</h1>
          <p className="mt-5 line-clamp-4 max-w-xl text-base leading-7 text-[var(--color-text-secondary)]">
            {item.overview || 'Una pieza destacada para empezar a explorar el catalogo.'}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={href} className="primary-action">
              Ver detalle
            </Link>
            <Link to={item.mediaType === 'Movie' ? '/movies/search' : '/series/search'} className="secondary-action">
              Explorar mas
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
