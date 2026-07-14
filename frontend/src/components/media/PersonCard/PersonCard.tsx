import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FadeInImage } from '../../ui/FadeInImage'
import type { PersonSummary } from '../../../features/public-media/types/publicMedia.types'

type PersonCardProps = {
  person: PersonSummary
  layout?: 'grid' | 'carousel'
}

function PersonCardComponent({ person, layout = 'grid' }: PersonCardProps) {
  const knownFor = person.knownFor
    .slice(0, 2)
    .map((item) => item.title)
    .join(' / ')
  const layoutClass =
    layout === 'carousel'
      ? 'min-w-[9.5rem] max-w-[9.5rem] shrink-0 sm:min-w-[11rem] sm:max-w-[11rem]'
      : 'min-w-0 w-full'

  return (
    <Link to={`/people/${person.tmdbId}`} className={`group block ${layout === 'grid' ? 'media-card-cv' : ''} ${layoutClass}`}>
      <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-200/28">
        {person.profileUrl ? (
          <FadeInImage
            src={person.profileUrl}
            alt={person.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">
            Sin foto
          </div>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 break-words text-sm font-semibold leading-snug text-white">{person.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--color-text-secondary)]">
        {knownFor || person.knownForDepartment || 'Persona'}
      </p>
    </Link>
  )
}

export const PersonCard = memo(PersonCardComponent)
