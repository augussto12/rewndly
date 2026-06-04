import { PosterCard } from '../PosterCard/PosterCard'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'

type MediaCarouselProps = {
  title: string
  items: MediaSummary[]
}

export function MediaCarousel({ title, items }: MediaCarouselProps) {
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
      </div>
      <div className="scrollbar-cinema flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
        {items.map((item) => (
          <PosterCard key={`${item.mediaType}-${item.tmdbId}`} item={item} />
        ))}
      </div>
    </section>
  )
}
