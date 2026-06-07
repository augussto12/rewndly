import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../../../services/apiError'
import { useAuth } from '../../auth/useAuth'
import {
  useDeleteTmdbRating,
  useSetTmdbFavorite,
  useSetTmdbRating,
  useSetTmdbWatchlist,
  useTmdbConnectionStatus,
  useTmdbMediaState,
} from '../hooks/useTmdbAccount'
import {
  useAddListItem,
  useCreateList,
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
  const { data: tmdbConnection } = useTmdbConnectionStatus(isAuthenticated)
  const { data: tmdbState } = useTmdbMediaState(mediaType, tmdbId, isAuthenticated && Boolean(tmdbConnection?.isConnected))
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useMediaReviews(mediaType, tmdbId)
  const createLibraryItem = useCreateLibraryItem()
  const updateLibraryItem = useUpdateLibraryItem()
  const createReview = useCreateReview()
  const addListItem = useAddListItem()
  const createList = useCreateList()

  const existingItem = useMemo(
    () => library?.find((item) => item.mediaType === mediaType && item.tmdbId === tmdbId),
    [library, mediaType, tmdbId],
  )

  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewVisibility, setReviewVisibility] = useState<Visibility>('Public')
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [selectedListId, setSelectedListId] = useState('')
  const [newListTitle, setNewListTitle] = useState('')
  const [newListVisibility, setNewListVisibility] = useState<Visibility>('Public')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const canSubmitReview = reviewTitle.trim().length > 0 && reviewBody.trim().length > 0

  async function submitReview() {
    const request: ReviewRequest = {
      mediaType,
      tmdbId,
      ratingSnapshot: existingItem?.rating ?? null,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      containsSpoilers,
      visibility: reviewVisibility,
    }

    setReviewError(null)

    try {
      await createReview.mutateAsync(request)
      setReviewTitle('')
      setReviewBody('')
      setContainsSpoilers(false)
    } catch (error) {
      setReviewError(getErrorMessage(error, 'No se pudo publicar la resena. Revisa los datos e intenta de nuevo.'))
    }
  }

  async function submitListItem() {
    if (!selectedListId) {
      return
    }

    setListError(null)

    try {
      await addListItem.mutateAsync({
        id: selectedListId,
        request: {
          mediaType,
          tmdbId,
          position: null,
          note: null,
        },
      })
    } catch (error) {
      setListError(getErrorMessage(error, 'No se pudo agregar a la lista. Revisa la lista seleccionada e intenta de nuevo.'))
    }
  }

  async function submitQuickList() {
    if (!newListTitle.trim()) {
      return
    }

    setListError(null)

    try {
      const list = await createList.mutateAsync({
        title: newListTitle.trim(),
        description: null,
        visibility: newListVisibility,
      })
      setNewListTitle('')
      setSelectedListId(list.id)
    } catch (error) {
      setListError(getErrorMessage(error, 'No se pudo crear la lista. Revisa el titulo e intenta de nuevo.'))
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <TmdbMediaControls
          key={`${tmdbConnection?.isConnected ? 'connected' : 'disconnected'}-${tmdbState?.rating ?? 'none'}`}
          mediaType={mediaType}
          tmdbId={tmdbId}
          isConnected={Boolean(tmdbConnection?.isConnected)}
          state={tmdbState}
        />

        <LibraryControls
          key={existingItem?.id ?? `new-${mediaType}-${tmdbId}`}
          mediaType={mediaType}
          tmdbId={tmdbId}
          existingItem={existingItem}
          createPending={createLibraryItem.isPending}
          updatePending={updateLibraryItem.isPending}
          onCreate={(request) => createLibraryItem.mutateAsync(request)}
          onUpdate={(id, request) => updateLibraryItem.mutateAsync({ id, request })}
        />

        <div className="surface-panel p-5">
          <h2 className="text-xl font-semibold">Agregar a lista</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Crea una lista aca mismo o elegi una existente para sumar este contenido.
          </p>
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
              Todavia no tenes listas. Crea una abajo o administra todas desde{' '}
              <Link to="/me/lists" className="text-[var(--color-accent-light)]">
                Mis listas
              </Link>.
            </p>
          )}
          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <input
              value={newListTitle}
              onChange={(event) => setNewListTitle(event.target.value)}
              placeholder="Nueva lista"
              className="field"
            />
            <select value={newListVisibility} onChange={(event) => setNewListVisibility(event.target.value as Visibility)} className="field">
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button onClick={() => void submitQuickList()} disabled={!newListTitle.trim() || createList.isPending} className="secondary-action">
              Crear lista
            </button>
          </div>
          {listError ? <ActionError message={listError} /> : null}
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
        {reviewError ? <ActionError message={reviewError} /> : null}
      </div>

      <ReviewsBlock reviews={reviews ?? []} isLoading={reviewsLoading} isError={reviewsError} />
    </section>
  )
}

function LibraryControls({
  mediaType,
  tmdbId,
  existingItem,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
}: {
  mediaType: MediaKind
  tmdbId: number
  existingItem: { id: string; status: WatchStatus; rating: number | null; isFavorite: boolean } | undefined
  createPending: boolean
  updatePending: boolean
  onCreate: (request: LibraryItemRequest) => Promise<unknown>
  onUpdate: (id: string, request: LibraryItemRequest) => Promise<unknown>
}) {
  const [status, setStatus] = useState<WatchStatus>(existingItem?.status ?? 'WantToWatch')
  const [rating, setRating] = useState(existingItem?.rating?.toString() ?? '')
  const [isFavorite, setIsFavorite] = useState(existingItem?.isFavorite ?? false)
  const [error, setError] = useState<string | null>(null)

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

    setError(null)

    try {
      if (existingItem) {
        await onUpdate(existingItem.id, request)
      } else {
        await onCreate(request)
      }
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'No se pudo guardar en tu biblioteca. Revisa los datos e intenta de nuevo.'))
    }
  }

  return (
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
        disabled={createPending || updatePending}
        className="primary-action mt-5"
      >
        {existingItem ? 'Actualizar' : 'Guardar'}
      </button>
      {error ? <ActionError message={error} /> : null}
    </div>
  )
}

function TmdbMediaControls({
  mediaType,
  tmdbId,
  isConnected,
  state,
}: {
  mediaType: MediaKind
  tmdbId: number
  isConnected: boolean
  state: { favorite: boolean; watchlist: boolean; rating: number | null } | undefined
}) {
  const favorite = useSetTmdbFavorite()
  const watchlist = useSetTmdbWatchlist()
  const rate = useSetTmdbRating()
  const deleteRating = useDeleteTmdbRating()
  const [rating, setRating] = useState(state?.rating?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)

  async function runTmdbAction(action: () => Promise<unknown>) {
    setError(null)

    try {
      await action()
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'No se pudo sincronizar con TMDB. Proba nuevamente.'))
    }
  }

  if (!isConnected) {
    return (
      <div className="surface-panel p-5">
        <p className="kicker">TMDB</p>
        <h2 className="mt-2 text-xl font-semibold">Cuenta no conectada</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Conecta TMDB para marcar favorito, watchlist y rating tambien en tu cuenta remota.
        </p>
        <Link to="/me/tmdb" className="secondary-action mt-5 inline-flex">
          Conectar TMDB
        </Link>
      </div>
    )
  }

  return (
    <div className="surface-panel p-5">
      <p className="kicker">TMDB</p>
      <h2 className="mt-2 text-xl font-semibold">Sincronizar con TMDB</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => void runTmdbAction(() => favorite.mutateAsync({ mediaType, tmdbId, value: !state?.favorite }))}
          disabled={favorite.isPending}
          className={state?.favorite ? 'primary-action' : 'secondary-action'}
        >
          {state?.favorite ? 'Quitar favorito' : 'Favorito'}
        </button>
        <button
          onClick={() => void runTmdbAction(() => watchlist.mutateAsync({ mediaType, tmdbId, value: !state?.watchlist }))}
          disabled={watchlist.isPending}
          className={state?.watchlist ? 'primary-action' : 'secondary-action'}
        >
          {state?.watchlist ? 'Quitar watchlist' : 'Watchlist'}
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          type="number"
          min="0.5"
          max="10"
          step="0.5"
          placeholder="Rating TMDB"
          className="field min-w-0 flex-1"
        />
        <button
          onClick={() => void runTmdbAction(() => rate.mutateAsync({ mediaType, tmdbId, value: Number(rating) }))}
          disabled={!rating || rate.isPending}
          className="secondary-action"
        >
          Puntuar
        </button>
        {state?.rating ? (
          <button
            onClick={() => void runTmdbAction(() => deleteRating.mutateAsync({ mediaType, tmdbId }))}
            disabled={deleteRating.isPending}
            className="secondary-action"
          >
            Borrar rating
          </button>
        ) : null}
      </div>
      {error ? <ActionError message={error} /> : null}
    </div>
  )
}

function ActionError({ message }: { message: string }) {
  return <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
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
