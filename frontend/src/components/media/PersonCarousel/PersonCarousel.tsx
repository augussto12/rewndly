import { PersonCard } from '../PersonCard/PersonCard'
import type { PersonSummary } from '../../../features/public-media/types/publicMedia.types'

type PersonCarouselProps = {
  title: string
  items: PersonSummary[]
}

export function PersonCarousel({ title, items }: PersonCarouselProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="mb-4 px-4 sm:px-6">
        <p className="kicker">Personas</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      </div>
      <div className="scrollbar-cinema flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
        {items.map((person) => (
          <PersonCard key={person.tmdbId} person={person} layout="carousel" />
        ))}
      </div>
    </section>
  )
}
