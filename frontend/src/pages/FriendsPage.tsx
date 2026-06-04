import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FriendCard } from '../features/social/components/FriendCard'
import { useDeleteFriendship, useFriends } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function FriendsPage() {
  const { data, isError, isLoading } = useFriends()
  const deleteFriendship = useDeleteFriendship()

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader title="Amigos" subtitle="Personas cuyo criterio queres tener cerca." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin amigos todavia" message="Busca perfiles y envia solicitudes." /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((friend) => (
            <FriendCard key={friend.friendshipId} friend={friend} onRemove={(id) => void deleteFriendship.mutateAsync(id)} />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
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
