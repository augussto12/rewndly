import { useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FriendCard } from '../features/social/components/FriendCard'
import { useDeleteFriendship, useFriends } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function FriendsPage() {
  const { data, isError, isLoading } = useFriends()
  const deleteFriendship = useDeleteFriendship()
  const [actionError, setActionError] = useState<string | null>(null)

  async function removeFriendship(id: string) {
    setActionError(null)

    try {
      await deleteFriendship.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo eliminar la amistad. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader title="Amigos" subtitle="Personas cuyo criterio queres tener cerca." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin amigos todavía" message="Buscá perfiles y enviá solicitudes." /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((friend) => (
            <FriendCard key={friend.friendshipId} friend={friend} onRemove={(id) => void removeFriendship(id)} />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <p className="mb-6 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <p className="kicker">Social</p>
      <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">{subtitle}</p>
    </header>
  )
}
