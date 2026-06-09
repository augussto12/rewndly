import type { ExternalRating } from '../../../features/public-media/types/publicMedia.types'

type ExternalRatingsBarProps = {
  ratings: ExternalRating[]
}

export function ExternalRatingsBar({ ratings }: ExternalRatingsBarProps) {
  const visibleRatings = ratings.filter((rating) => Number.isFinite(rating.value) && Number.isFinite(rating.scale))

  if (visibleRatings.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0" aria-label="Ratings externos">
      {visibleRatings.map((rating) => (
        <span
          key={rating.source}
          className="inline-flex h-8 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.075] px-3 text-xs font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur"
          title={rating.votes ? `${rating.label} con ${rating.votes.toLocaleString('es-AR')} votos` : rating.label}
        >
          <span className="text-[var(--color-text-secondary)]">{rating.label}</span>
          <span>{formatRating(rating)}</span>
        </span>
      ))}
    </div>
  )
}

function formatRating(rating: ExternalRating) {
  if (rating.scale === 100) {
    return rating.source === 'Metacritic' ? `${Math.round(rating.value)}/100` : `${Math.round(rating.value)}%`
  }

  if (rating.scale === 5) {
    return `${formatDecimal(rating.value)}/5`
  }

  return `${formatDecimal(rating.value)}/10`
}

function formatDecimal(value: number) {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })
}
