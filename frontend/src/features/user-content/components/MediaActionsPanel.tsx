import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  useAddListItem,
  useCreateLibraryItem,
  useCreateReview,
  useMediaReviews,
  useMyLibrary,
  useMyLists,
  useUpdateLibraryItem,
} from '../hooks/useUserContent'
import type { LibraryItemRequest, MediaKind, ReviewRequest, Visibility, WatchStatus } from '../types/userContent.types'

type MediaActionsPanelProps = {
  mediaType: MediaKind
  tmdbId: number
  title: string
}

const statusOptions: Array<{ value: WatchStatus; label: string }> = [
  { value: 'WantToWatch', label: 'Quiero ver' },
  { value: 'Watching', label: 'Viendo' },
  { value: 'Watched', label: 'Vista' },
  { value: 'Dropped', label: 'Abandonada' },
]

const visibilityOptions: Array<{ value: Visibility; label: string }> = [
  { value: 'Public', label: 'Publica' },
  { value: 'FriendsOnly', label: 'Solo amigos' },
  { value: 'Private', label: 'Privada' },
]

export function MediaActionsPanel({ mediaType, tmdbId, title }: MediaActionsPanelProps) {
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)
  const { data: lists } = useMyLists(isAuthenticated)
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useMediaReviews(mediaType, tmdbId)
  const createLibraryItem = useCreateLibraryItem()
  const updateLibraryItem = useUpdateLibraryItem()
  const createReview = useCreateReview()
  const addListItem = useAddListItem()

  const existingItem = useMemo(
    () => library?.find((item) => item.mediaType === mediaType && item.tmdbId === tmdbId),
    [library, mediaType, tmdbId],
  )

  const [status, setStatus] = useState<WatchStatus>('WantToWatch')
  const [rating, setRating] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewVisibility, setReviewVisibility] = useState<Visibility>('Public')
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [selectedListId, setSelectedListId] = useState('')

  useEffect(() => {
    if (!existingItem) {
      return
    }

    setStatus(existingItem.status)
    setRating(existingItem.rating?.toString() ?? '')
    setIsFavorite(existingItem.isFavorite)
  }, [existingItem])

  const canSubmitReview = reviewTitle.trim().length > 0 && reviewBody.trim().length > 0

  async function saveLibraryItem() {
    const request: LibraryItemRequest = {
      mediaType,
      tmdbId,
      status,
      isFavorite,
      rating: rating ? Number(rating) : null,
      watchedAt: status === 'Watched' ? new Date().toISOString() : null,
      startedAt: status === 'Watching' ? new Date().toISOString() : null,
    }

    if (existingItem) {
      await updateLibraryItem.mutateAsync({ id: existingItem.id, request })
    } else {
      await createLibraryItem.mutateAsync(request)
    }
  }

  async function submitReview() {
    const request: ReviewRequest = {
      mediaType,
      tmdbId,
      ratingSnapshot: rating ? Number(rating) : null,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      containsSpoilers,
      visibility: reviewVisibility,
    }

    await createReview.mutateAsync(request)
    setReviewTitle('')
    setReviewBody('')
    setContainsSpoilers(false)
  }

  async function submitListItem() {
    if (!selectedListId) {
      return
    }

    await addListItem.mutateAsync({
      id: selectedListId,
      request: {
        mediaType,
        tmdbId,
        position: null,
        note: null,
      },
    })
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="surface-panel p-6">
          <p className="kicker">Tu espacio</p>
          <h2 className="mt-3 text-2xl font-semibold">Guarda, puntua y resena {title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Inicia sesion para sumar este contenido a tu biblioteca, crear listas y dejar una resena independiente.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login" className="primary-action">
              Iniciar sesion
            </Link>
            <Link to="/register" className="secondary-action">
              Crear cuenta
            </Link>
          </div>
        </div>
        <ReviewsBlock reviews={reviews ?? []} isLoading={reviewsLoading} isError={reviewsError} />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 pb-12 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="surface-panel p-5">
          <h2 className="text-xl font-semibold">Mi biblioteca</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-[var(--color-text-secondary)]">
              Estado
              <select value={status} onChange={(event) => setStatus(event.target.value as WatchStatus)} className="field mt-2">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[var(--color-text-secondary)]">
              Rating
              <input value={rating} onChange={(event) => setRating(event.target.value)} type="number" min="1" max="10" className="field mt-2" />
            </label>
            <label className="flex items-end gap-3 text-sm text-[var(--color-text-secondary)]">
              <input
                checked={isFavorite}
                onChange={(event) => setIsFavorite(event.target.checked)}
                type="checkbox"
                className="mb-2 h-4 w-4 accent-[var(--color-accent)]"
              />
              Favorita
            </label>
          </div>
          <button
            onClick={() => void saveLibraryItem()}
            disabled={createLibraryItem.isPending || updateLibraryItem.isPending}
            className="primary-action mt-5"
          >
            {existingItem ? 'Actualizar' : 'Guardar'}
          </button>
        </div>

        <div className="surface-panel p-5">
          <h2 className="text-xl font-semibold">Agregar a lista</h2>
          {lists && lists.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)} className="field min-w-0 flex-1">
                <option value="">Seleccionar lista</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
              <button onClick={() => void submitListItem()} disabled={!selectedListId || addListItem.isPending} className="secondary-action">
                Agregar
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              Crea una lista desde <Link to="/me/lists" className="text-[var(--color-accent-light)]">Mis listas</Link>.
            </p>
          )}
        </div>
      </div>

      <div className="surface-panel p-5">
        <h2 className="text-xl font-semibold">Crear resena</h2>
        <div className="mt-4 grid gap-3">
          <input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Titulo" className="field" />
          <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Tu resena" rows={5} className="field" />
          <div className="flex flex-wrap items-center gap-4">
            <select value={reviewVisibility} onChange={(event) => setReviewVisibility(event.target.value as Visibility)} className="field w-auto">
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <input
                checked={containsSpoilers}
                onChange={(event) => setContainsSpoilers(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Contiene spoilers
            </label>
            <button onClick={() => void submitReview()} disabled={!canSubmitReview || createReview.isPending} className="primary-action">
              Publicar
            </button>
          </div>
        </div>
      </div>

      <ReviewsBlock reviews={reviews ?? []} isLoading={reviewsLoading} isError={reviewsError} />
    </section>
  )
}

function ReviewsBlock({
  reviews,
  isLoading,
  isError,
}: {
  reviews: Array<{ id: string; username: string; title: string; body: string; ratingSnapshot: number | null; containsSpoilers: boolean }>
  isLoading: boolean
  isError: boolean
}) {
  return (
    <div className="surface-panel mt-6 p-5">
      <h2 className="text-xl font-semibold">Resenas publicas</h2>
      {isLoading ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Cargando resenas...</p> : null}
      {isError ? <p className="mt-3 text-sm text-red-200">No pudimos cargar resenas.</p> : null}
      {!isLoading && !isError && reviews.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Todavia no hay resenas publicas.</p>
      ) : null}
      <div className="mt-4 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.035] p-4 transition hover:border-violet-200/20">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>@{review.username}</span>
              {review.ratingSnapshot ? <span>{review.ratingSnapshot}/10</span> : null}
              {review.containsSpoilers ? <span className="text-amber-200">Spoilers</span> : null}
            </div>
            <h3 className="mt-2 font-semibold">{review.title}</h3>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--color-text-secondary)]">{review.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
