import { useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useAuth } from '../features/auth/useAuth'
import { PublicListCard } from '../features/social/components/PublicListCard'
import { usePublicListsPages } from '../features/social/hooks/useSocial'
import type { PublicList } from '../features/social/types/social.types'
import { useCreateList } from '../features/user-content/hooks/useUserContent'
import type { Visibility } from '../features/user-content/types/userContent.types'
import { flattenUniqueArrayPages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function PublicListsPage() {
  const { isAuthenticated } = useAuth()
  const lists = usePublicListsPages()
  const createList = useCreateList()
  const data = flattenUniqueArrayPages<PublicList>(lists.data, (list) => list.id)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('Public')
  const [actionError, setActionError] = useState<string | null>(null)

  async function submitList() {
    if (!title.trim()) {
      return
    }

    setActionError(null)

    try {
      await createList.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        visibility,
      })
      setTitle('')
      setDescription('')
      setVisibility('Public')
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo crear la lista. Revisá los datos e intentá de nuevo.'))
    }
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold">Listas públicas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Colecciones compartidas por la comunidad, con privacidad visible y lectura cómoda.</p>
        </header>
        {isAuthenticated ? (
          <section className="surface-panel mb-8 p-5">
            <h2 className="text-xl font-semibold">Crear lista</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Creá una lista pública, privada o solo para amigos. Después podés sumar películas y series desde cada detalle.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem_auto]">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" className="field" />
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción" className="field" />
              <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="field">
                <option value="Public">Pública</option>
                <option value="FriendsOnly">Solo amigos</option>
                <option value="Private">Privada</option>
              </select>
              <button onClick={() => void submitList()} disabled={!title.trim() || createList.isPending} className="primary-action">
                Crear
              </button>
            </div>
            {actionError ? <ActionError message={actionError} /> : null}
          </section>
        ) : null}
        {lists.isLoading ? <LoadingSkeleton /> : null}
        {lists.isError ? <ErrorState /> : null}
        {!lists.isLoading && !lists.isError && data.length === 0 ? <EmptyState title="Sin listas públicas" message="Todavía no hay listas visibles." /> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((list) => <PublicListCard key={list.id} list={list} />)}
        </div>
        <LoadMoreButton
          hasMore={Boolean(lists.hasNextPage)}
          isLoading={lists.isFetchingNextPage}
          onClick={() => void lists.fetchNextPage()}
        />
      </main>
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}

function LoadMoreButton({ hasMore, isLoading, onClick }: { hasMore: boolean; isLoading: boolean; onClick: () => void }) {
  if (!hasMore) {
    return null
  }

  return (
    <div className="mt-8 flex justify-center">
      <button type="button" onClick={onClick} disabled={isLoading} className="secondary-action">
        {isLoading ? 'Cargando...' : 'Mostrar más'}
      </button>
    </div>
  )
}
