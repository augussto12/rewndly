import { Link } from 'react-router-dom'
import type { Friend } from '../types/social.types'

type FriendCardProps = {
  friend: Friend
  onRemove?: (id: string) => void
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  return (
    <article className="surface-panel p-4 transition hover:border-violet-200/20">
      <Link to={`/users/${friend.username}`} className="flex items-center gap-3">
        <Avatar src={friend.avatarUrl} label={friend.displayName} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{friend.displayName}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">@{friend.username}</p>
        </div>
      </Link>
      {onRemove ? (
        <button onClick={() => onRemove(friend.friendshipId)} className="secondary-action mt-4">
          Eliminar amistad
        </button>
      ) : null}
    </article>
  )
}

function Avatar({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-violet-200/20 bg-[var(--color-accent-soft)] text-sm font-semibold">
      {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : label.slice(0, 1).toUpperCase()}
    </div>
  )
}
