import { useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FriendRequestCard } from '../features/social/components/FriendRequestCard'
import { useAcceptFriendRequest, useFriendRequests, useRejectFriendRequest, useSendFriendRequest } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function FriendRequestsPage() {
  const [username, setUsername] = useState('')
  const { data, isError, isLoading } = useFriendRequests()
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const rejectRequest = useRejectFriendRequest()

  async function submit() {
    if (!username.trim()) {
      return
    }

    await sendRequest.mutateAsync(username.trim())
    setUsername('')
  }

  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Solicitudes</p>
          <h1 className="mt-3 text-4xl font-semibold">Solicitudes de amistad</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Invita por username y acepta conexiones con criterio.</p>
        </header>
        <section className="surface-panel mb-8 flex flex-col gap-3 p-4 sm:flex-row">
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" className="field min-w-0 flex-1" />
          <button onClick={() => void submit()} className="primary-action">
            Enviar
          </button>
        </section>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin solicitudes" message="Las solicitudes entrantes y salientes apareceran aca." /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              onAccept={(id) => void acceptRequest.mutateAsync(id)}
              onReject={(id) => void rejectRequest.mutateAsync(id)}
            />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}
