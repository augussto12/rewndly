import { Link } from 'react-router-dom'
import { PosterCard } from '../PosterCard/PosterCard'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'

type MediaCarouselProps = {
  title: string
  items: MediaSummary[]
  viewAllHref?: string
}

export function MediaCarousel({ title, items, viewAllHref }: MediaCarouselProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="mb-4 flex items-end justify-between px-4 sm:px-6">
        <div>
          <p className="kicker">Seleccion</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        {viewAllHref ? (
          <Link to={viewAllHref} className="secondary-action min-h-9 px-3 py-2 text-xs">
            Ver todo
          </Link>
        ) : null}
      </div>
      <div className="scrollbar-cinema flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
        {items.map((item) => (
          <PosterCard key={`${item.mediaType}-${item.tmdbId}`} item={item} layout="carousel" />
        ))}
      </div>
    </section>
  )
}
