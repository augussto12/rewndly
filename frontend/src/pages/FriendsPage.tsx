import { useState } from 'react'
import { useConfirm } from '../components/feedback/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FriendCard } from '../features/social/components/FriendCard'
import { useDeleteFriendship, useFriends } from '../features/social/hooks/useSocial'
import { PaginationFooter } from '../components/ui/PaginationFooter'
import { useClientPagination } from '../components/ui/useClientPagination'
import { InlineError } from '../components/feedback/InlineError/InlineError'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function FriendsPage() {
  const { data, isError, isLoading } = useFriends()
  const pager = useClientPagination(data ?? [], 24)
  const deleteFriendship = useDeleteFriendship()
  const [actionError, setActionError] = useState<string | null>(null)
  const { confirm, confirmDialog } = useConfirm()

  async function removeFriendship(id: string) {
    const confirmed = await confirm({
      title: 'Eliminar amistad',
      message: 'Se va a quitar de tu lista de amigos. Vas a poder volver a enviarle una solicitud más adelante.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    setActionError(null)

    try {
      await deleteFriendship.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo eliminar la amistad. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <PageHeader title="Amigos" subtitle="Personas cuyo criterio querés tener cerca." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin amigos todavía" message="Buscá perfiles y enviá solicitudes." /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pager.pagedItems.map((friend) => (
            <FriendCard key={friend.friendshipId} friend={friend} onRemove={(id) => void removeFriendship(id)} />
          ))}
        </div>
        <PaginationFooter pager={pager} unit="amigos" />
      </main>
      {confirmDialog}
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <InlineError message={message} className="mb-6" />
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
