import { useState, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { toast } from '../components/feedback/Toast/toastStore'
import { VisibilityChip } from '../features/user-content/components/VisibilityChip'
import { useCreateList, useDeleteList, useMyLists } from '../features/user-content/hooks/useUserContent'
import type { UserList, Visibility } from '../features/user-content/types/userContent.types'
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
      toast.error('Falta el título', 'Escribí un nombre para crear la lista.')
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
      setActionError(getErrorMessage(error, 'No se pudo crear la lista. Revisá los datos e intentá de nuevo.'))
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
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Listas</p>
          <h1 className="mt-3 text-4xl font-semibold">Mis listas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Colecciones públicas, privadas o visibles solo para amigos.</p>
        </header>

        <section className="surface-panel mb-8 p-5">
          <h2 className="text-xl font-semibold">Crear lista</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" className="field" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción" className="field" />
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="field">
              <option value="Public">Pública</option>
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
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin listas" message="Creá tu primera lista." /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((list) => (
            <ListCard key={list.id} list={list} isDeleting={deleteList.isPending} onRemove={() => void removeList(list.id)} />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

function ListCard({ list, isDeleting, onRemove }: { list: UserList; isDeleting: boolean; onRemove: () => void }) {
  return (
    <article className="surface-panel flex min-h-56 flex-col p-5 transition hover:border-violet-200/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <VisibilityChip value={list.visibility} />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-xs font-semibold text-white/80">
          <ListIcon />
          {formatTitleCount(list.itemCount)}
        </span>
      </div>

      <Link to={`/me/lists/${list.id}`} className="group block min-w-0">
        <h2 className="line-clamp-2 text-xl font-semibold transition group-hover:text-violet-100">{list.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {list.description || <span className="italic opacity-55">Sin descripción</span>}
        </p>
      </Link>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link to={`/me/lists/${list.id}`} className="secondary-action min-h-9 px-3 py-2 text-xs">
          <OpenIcon />
          Ver lista
        </Link>
        <button
          type="button"
          onClick={onRemove}
          disabled={isDeleting}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TrashIcon />
          Eliminar
        </button>
      </div>
    </article>
  )
}

function formatTitleCount(count: number) {
  return count === 1 ? '1 título' : `${count} títulos`
}

function ActionError({ message }: { message: string }) {
  return <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function OpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 18 15 12 9 6" />
    </svg>
  )
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
    </svg>
  )
}
