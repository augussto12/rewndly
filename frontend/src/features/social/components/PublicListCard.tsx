import { Link } from 'react-router-dom'
import type { PublicList } from '../types/social.types'
import { VisibilityBadge } from './VisibilityBadge'

export function PublicListCard({ list }: { list: PublicList }) {
  return (
    <article className="surface-panel p-5 transition hover:border-violet-200/20">
      <div className="flex flex-wrap items-center gap-2">
        <VisibilityBadge value={list.visibility} />
        <Link to={`/users/${list.username}`} className="text-sm text-[var(--color-text-secondary)] hover:text-white">
          @{list.username}
        </Link>
      </div>
      <Link to={`/lists/${list.id}`} className="mt-3 block text-xl font-semibold hover:text-violet-100">
        {list.title}
      </Link>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{list.description || 'Lista sin descripción.'}</p>
      <p className="mt-4 text-xs text-[var(--color-text-secondary)]">{formatItemCount(list.itemCount)}</p>
    </article>
  )
}

function formatItemCount(count: number) {
  return count === 1 ? '1 título' : `${count} títulos`
}
