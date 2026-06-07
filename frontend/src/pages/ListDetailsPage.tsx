import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useDeleteListItem, useListDetails } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function ListDetailsPage() {
  const { id } = useParams()
  const { data, isError, isLoading } = useListDetails(id)
  const deleteItem = useDeleteListItem()
  const [actionError, setActionError] = useState<string | null>(null)

  async function removeItem(listId: string, itemId: string) {
    setActionError(null)

    try {
      await deleteItem.mutateAsync({ listId, itemId })
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo quitar el contenido de la lista. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState title="No pudimos cargar la lista" /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data ? (
          <>
            <header className="mb-8">
              <Link to="/me/lists" className="secondary-action">
                Volver a listas
              </Link>
              <h1 className="mt-5 text-4xl font-semibold">{data.title}</h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">{data.description || data.visibility}</p>
            </header>
            {data.items.length === 0 ? <EmptyState title="Lista vacia" message="Agrega contenido desde el detalle de pelicula o serie." /> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.items.map((item) => (
                <article key={item.id} className="surface-panel p-4">
                  <Link to={item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`}>
                    <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5">
                      {item.posterUrl ? <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                    </div>
                    <h2 className="mt-3 line-clamp-2 font-semibold">{item.title}</h2>
                  </Link>
                  <button onClick={() => void removeItem(data.id, item.id)} className="secondary-action mt-3">
                    Quitar
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <p className="mb-6 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}
