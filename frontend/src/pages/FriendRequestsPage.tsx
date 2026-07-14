import { useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { toast } from '../components/feedback/Toast/toastStore'
import { FriendRequestCard } from '../features/social/components/FriendRequestCard'
import { useAcceptFriendRequest, useFriendRequests, useRejectFriendRequest, useSendFriendRequest } from '../features/social/hooks/useSocial'
import { InlineError } from '../components/feedback/InlineError/InlineError'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function FriendRequestsPage() {
  const [username, setUsername] = useState('')
  const { data, isError, isLoading } = useFriendRequests()
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()
  const [actionError, setActionError] = useState<string | null>(null)

  async function submit() {
    if (!username.trim()) {
      toast.error('Falta el usuario', 'Escribí el usuario al que querés enviarle solicitud.')
      return
    }

    setActionError(null)

    try {
      await sendRequest.mutateAsync(username.trim())
      setUsername('')
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo enviar la solicitud. Revisá el usuario e intentá de nuevo.'))
    }
  }

  async function accept(id: string) {
    setActionError(null)

    try {
      await acceptRequest.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo aceptar la solicitud. Puede que ya no esté pendiente.'))
    }
  }

  async function reject(id: string) {
    setActionError(null)

    try {
      await rejectRequest.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo rechazar la solicitud. Puede que ya no esté pendiente.'))
    }
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Solicitudes</p>
          <h1 className="mt-3 text-4xl font-semibold">Solicitudes de amistad</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Invitá por usuario y aceptá conexiones con criterio.</p>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="surface-panel mb-8 flex flex-col gap-3 p-4 sm:flex-row"
        >
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Usuario"
            aria-label="Usuario a invitar"
            className="field min-w-0 flex-1"
          />
          <button type="submit" disabled={sendRequest.isPending} className="primary-action">
            Enviar
          </button>
        </form>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin solicitudes" message="Las solicitudes entrantes y salientes aparecerán acá." /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              onAccept={(id) => void accept(id)}
              onReject={(id) => void reject(id)}
            />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <InlineError message={message} className="mb-6" />
}
