import { Link } from 'react-router-dom'
import type { PublicReview } from '../types/social.types'
import { VisibilityBadge } from './VisibilityBadge'

export function ReviewCard({ review }: { review: PublicReview }) {
  const href = review.mediaType === 'Movie' ? `/movies/${review.tmdbId}` : `/series/${review.tmdbId}`

  return (
    <article className="surface-panel p-5 transition hover:border-violet-200/20">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Link to={`/users/${review.username}`} className="font-medium text-white hover:text-violet-100">
          {review.displayName}
        </Link>
        <VisibilityBadge value={review.visibility} />
        {review.ratingSnapshot ? <span>{review.ratingSnapshot}/10</span> : null}
        {review.containsSpoilers ? <span className="text-amber-200">Spoilers</span> : null}
      </div>
      <Link to={href} className="mt-3 block text-sm font-medium text-[var(--color-accent-light)]">
        {review.mediaTitle}
      </Link>
      <h2 className="mt-2 text-xl font-semibold">{review.title}</h2>
      <p className="mt-3 line-clamp-5 text-sm leading-6 text-[var(--color-text-secondary)]">{review.body}</p>
    </article>
  )
}
