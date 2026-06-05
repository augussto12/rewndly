import { RatingBadge } from '../RatingBadge/RatingBadge'

type MediaDetailsHeaderProps = {
  title: string
  subtitle?: string | null
  overview?: string | null
  posterUrl?: string | null
  backdropUrl?: string | null
  voteAverage?: number | null
  genres: string[]
  meta: string[]
}

export function MediaDetailsHeader({
  title,
  subtitle,
  overview,
  posterUrl,
  backdropUrl,
  voteAverage,
  genres,
  meta,
}: MediaDetailsHeaderProps) {
  return (
    <section className="relative overflow-hidden">
      {backdropUrl ? <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-38" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.72)_0%,rgba(9,9,11,0.92)_54%,#09090b_100%)] backdrop-blur-[2px]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[16rem_1fr] md:py-20">
        <div className="w-44 md:w-full">
          <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/[0.12] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)]">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-[var(--color-text-secondary)]">Sin poster</div>
            )}
          </div>
        </div>
        <div className="min-w-0 self-end">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <RatingBadge value={voteAverage ?? null} />
            <span className="text-resilient text-sm text-[var(--color-text-secondary)]">{meta.filter(Boolean).join(' / ')}</span>
          </div>
          <h1 className="text-resilient text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
          {subtitle ? <p className="text-resilient mt-2 text-[var(--color-text-secondary)]">{subtitle}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span key={genre} className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-violet-100">
                {genre}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
            {overview || 'Todavia no hay sinopsis disponible.'}
          </p>
          <p className="mt-6 max-w-2xl rounded-[var(--radius-md)] border border-violet-200/14 bg-[var(--color-accent-soft)] p-4 text-sm leading-6 text-violet-100/86">
            Inicia sesion para guardar este contenido, puntuarlo, crear listas y escribir una resena independiente.
          </p>
        </div>
      </div>
    </section>
  )
}
