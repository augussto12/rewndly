import type { FriendRequest } from '../types/social.types'

type FriendRequestCardProps = {
  request: FriendRequest
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
}

export function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  const incoming = request.direction === 'Incoming'

  return (
    <article className="surface-panel p-4">
      <p className="kicker">{incoming ? 'Solicitud recibida' : 'Solicitud enviada'}</p>
      <h2 className="mt-3 font-semibold">{request.displayName}</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">@{request.username}</p>
      {incoming ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => onAccept?.(request.id)} className="primary-action">
            Aceptar
          </button>
          <button onClick={() => onReject?.(request.id)} className="secondary-action">
            Rechazar
          </button>
        </div>
      ) : null}
    </article>
  )
}
