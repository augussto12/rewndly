import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useCreateList, useDeleteList, useMyLists } from '../features/user-content/hooks/useUserContent'
import type { Visibility } from '../features/user-content/types/userContent.types'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function MyListsPage() {
  const { data, isError, isLoading } = useMyLists()
  const createList = useCreateList()
  const deleteList = useDeleteList()
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
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo crear la lista. Revisa los datos e intenta de nuevo.'))
    }
  }

  async function removeList(id: string) {
    setActionError(null)

    try {
      await deleteList.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo eliminar la lista. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Listas</p>
          <h1 className="mt-3 text-4xl font-semibold">Mis listas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Colecciones publicas, privadas o visibles solo para amigos.</p>
        </header>

        <section className="surface-panel mb-8 p-5">
          <h2 className="text-xl font-semibold">Crear lista</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" className="field" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripcion" className="field" />
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="field">
              <option value="Public">Publica</option>
              <option value="FriendsOnly">Solo amigos</option>
              <option value="Private">Privada</option>
            </select>
            <button onClick={() => void submitList()} className="primary-action">
              Crear
            </button>
          </div>
          {actionError ? <ActionError message={actionError} /> : null}
        </section>

        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin listas" message="Crea tu primera lista." /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((list) => (
            <article key={list.id} className="surface-panel p-5">
              <Link to={`/me/lists/${list.id}`}>
                <h2 className="text-xl font-semibold">{list.title}</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{list.description || 'Sin descripcion'}</p>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {list.visibility} / {list.itemCount} items
                </p>
              </Link>
              <button onClick={() => void removeList(list.id)} className="secondary-action mt-4">
                Eliminar
              </button>
            </article>
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

function ActionError({ message }: { message: string }) {
  return <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}
