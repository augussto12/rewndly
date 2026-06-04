import { Link } from 'react-router-dom'
import { RatingBadge } from '../RatingBadge/RatingBadge'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'

type PosterCardProps = {
  item: MediaSummary
}

export function PosterCard({ item }: PosterCardProps) {
  const href = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`

  return (
    <Link
      to={href}
      className="group block min-w-[9.5rem] max-w-[9.5rem] rounded-[var(--radius-md)] sm:min-w-[11rem] sm:max-w-[11rem]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-200/28">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">
            Sin poster
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/78 to-transparent opacity-80" />
        <div className="absolute right-2 top-2">
          <RatingBadge value={item.voteAverage} />
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white">{item.title}</h3>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        {item.releaseDate?.slice(0, 4) ?? (item.mediaType === 'Movie' ? 'Pelicula' : 'Serie')}
      </p>
    </Link>
  )
}
