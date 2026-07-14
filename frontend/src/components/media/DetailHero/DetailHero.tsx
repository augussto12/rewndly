import type { ReactNode } from 'react'
import { BackButton } from '../../navigation/BackButton'
import { RatingBadge } from '../RatingBadge/RatingBadge'

type DetailHeroProps = {
  eyebrow?: string
  title: string
  meta?: Array<string | null | undefined>
  /** Pass (even as null) to show a rating badge; omit entirely to hide it. */
  voteAverage?: number | null
  /** Portrait media on the left. Omit for a single-column, text-only hero (e.g. episodes). */
  poster?: { url: string | null; alt?: string; fallback?: string }
  backdropUrl?: string | null
  backHref: string
  actions?: ReactNode
  children?: ReactNode
}

/**
 * Shared detail-page hero so Collection / Season / Episode / Person share the same
 * backdrop treatment, poster sizing, spacing and back-button placement instead of
 * each hand-rolling its own. Stacks to a single column below `md`.
 */
export function DetailHero({ eyebrow, title, meta = [], voteAverage, poster, backdropUrl, backHref, actions, children }: DetailHeroProps) {
  const metaLine = meta.filter(Boolean).join(' / ')
  const showMetaRow = voteAverage !== undefined || metaLine.length > 0

  return (
    <section className="media-detail-hero relative overflow-hidden">
      {backdropUrl ? <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-38" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.72)_0%,rgba(9,9,11,0.9)_50%,rgba(9,9,11,0.98)_82%,rgba(16,34,54,0)_100%)] backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(16,34,54,0),rgba(16,34,54,0.74)_62%,rgba(16,34,54,0.96)_100%)]" />
      <div className="relative mx-auto max-w-[90rem] px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-16">
        <BackButton fallbackHref={backHref} className="mb-6 md:mb-7" />
        <div className={`grid gap-6 md:gap-8 ${poster ? 'md:grid-cols-[16rem_1fr]' : 'max-w-4xl'}`}>
          {poster ? (
            <div className="w-40 sm:w-56 md:w-full">
              <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/[0.12] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)]">
                {poster.url ? (
                  <img src={poster.url} alt={poster.alt ?? title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center px-2 text-center text-sm text-[var(--color-text-secondary)]">{poster.fallback ?? 'Sin póster'}</div>
                )}
              </div>
            </div>
          ) : null}
          <div className="min-w-0 self-end">
            {showMetaRow ? (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {voteAverage !== undefined ? <RatingBadge value={voteAverage ?? null} /> : null}
                {metaLine ? <span className="text-resilient text-sm text-[var(--color-text-secondary)]">{metaLine}</span> : null}
              </div>
            ) : null}
            {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
            <h1 className="text-resilient mt-3 text-3xl font-semibold leading-tight sm:text-5xl md:text-6xl">{title}</h1>
            {children ? <div className="mt-5 max-w-3xl">{children}</div> : null}
            {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
