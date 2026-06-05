import { PersonCard } from '../PersonCard/PersonCard'
import type { PersonSummary } from '../../../features/public-media/types/publicMedia.types'

type PersonGridProps = {
  items: PersonSummary[]
}

export function PersonGrid({ items }: PersonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((person) => (
        <PersonCard key={person.tmdbId} person={person} />
      ))}
    </div>
  )
}
