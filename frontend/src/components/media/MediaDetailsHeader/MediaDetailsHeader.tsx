import type { ReactNode } from 'react'
import type { ExternalRating } from '../../../features/public-media/types/publicMedia.types'
import { buildExternalRatingBadges, buildExternalRatingInsight } from '../../../features/public-media/utils/externalRatings'
import { BackButton } from '../../navigation/BackButton'
import { ExternalRatingsBar } from '../ExternalRatingsBar/ExternalRatingsBar'
import { RatingBadge } from '../RatingBadge/RatingBadge'

type MediaDetailsHeaderProps = {
  title: string
  subtitle?: string | null
  overview?: string | null
  posterUrl?: string | null
  backdropUrl?: string | null
  voteAverage?: number | null
  externalRatings?: ExternalRating[]
  releaseYear?: number | null
  genres: string[]
  meta: string[]
  backHref: string
  actionSlot?: ReactNode
}

export function MediaDetailsHeader({
  title,
  subtitle,
  overview,
  posterUrl,
  backdropUrl,
  voteAverage,
  externalRatings = [],
  releaseYear,
  genres,
  meta,
  backHref,
  actionSlot,
}: MediaDetailsHeaderProps) {
  const externalInsight = buildExternalRatingInsight(externalRatings)
  const externalBadges = buildExternalRatingBadges(externalRatings, releaseYear)

  return (
    <section className="media-detail-hero relative overflow-hidden">
      {backdropUrl ? <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-38" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.72)_0%,rgba(9,9,11,0.9)_50%,rgba(9,9,11,0.98)_82%,rgba(16,34,54,0)_100%)] backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(16,34,54,0),rgba(16,34,54,0.74)_62%,rgba(16,34,54,0.96)_100%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20">
        <BackButton fallbackHref={backHref} className="mb-7" />
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
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
            <ExternalRatingsBar ratings={externalRatings} />
            {externalInsight ? <p className="mt-2 text-sm text-violet-100/78">{externalInsight}</p> : null}
            {externalBadges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {externalBadges.map((badge) => (
                  <span key={badge} className="rounded-[var(--radius-sm)] border border-violet-200/20 bg-violet-300/[0.09] px-3 py-1 text-xs font-semibold text-violet-100">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
            <div className={`grid min-w-0 gap-4 ${actionSlot ? 'grid-cols-[minmax(0,1fr)_auto] items-start' : ''}`}>
              <h1 className="text-resilient text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
              {actionSlot ? <div className="shrink-0 justify-self-end pt-1 sm:pt-2">{actionSlot}</div> : null}
            </div>
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
          </div>
        </div>
      </div>
    </section>
  )
}
