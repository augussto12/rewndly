import { Link } from 'react-router-dom'
import type { ActivityEvent } from '../types/social.types'

const labels: Record<string, string> = {
  AddedToWatchlist: 'agrego a su lista',
  MarkedAsWatched: 'marco como vista',
  Rated: 'puntuo',
  Reviewed: 'reseno',
  CreatedList: 'creo una lista',
  AddedToList: 'agrego contenido a una lista',
  Favorited: 'marco como favorita',
  FriendRequestAccepted: 'acepto una solicitud',
  FriendAdded: 'sumo una amistad',
}

export function ActivityCard({ activity }: { activity: ActivityEvent }) {
  const mediaHref = activity.mediaType === 'Movie' ? `/movies/${activity.tmdbId}` : activity.mediaType === 'Series' ? `/series/${activity.tmdbId}` : null

  return (
    <article className="surface-panel grid gap-4 p-4 transition hover:border-violet-200/20 sm:grid-cols-[5rem_1fr]">
      <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5">
        {activity.posterUrl ? <img src={activity.posterUrl} alt={activity.mediaTitle ?? ''} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <Link to={`/users/${activity.username}`} className="font-semibold text-white hover:text-violet-100">
            {activity.displayName}
          </Link>{' '}
          {labels[activity.eventType] ?? activity.eventType}
        </p>
        {mediaHref && activity.mediaTitle ? (
          <Link to={mediaHref} className="mt-2 block text-xl font-semibold leading-snug hover:text-violet-100">
            {activity.mediaTitle}
          </Link>
        ) : (
          <h2 className="mt-2 text-xl font-semibold">Actividad social</h2>
        )}
        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">{new Date(activity.createdAt).toLocaleString()}</p>
      </div>
    </article>
  )
}
