import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '../../../components/feedback/Toast/toastStore'
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
import { formatLibraryRating, libraryRatingOptions, parseLibraryRating } from '../utils/ratingOptions'

type MediaActionsPanelProps = {
  mediaType: MediaKind
  tmdbId: number
  title: string
}

type ExistingLibraryItem = { id: string; status: WatchStatus; rating: number | null; isFavorite: boolean } | undefined

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

export function MediaQuickActions({ mediaType, tmdbId, title }: MediaActionsPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)
  const { data: lists } = useMyLists(isAuthenticated)
  const createLibraryItem = useCreateLibraryItem()
  const updateLibraryItem = useUpdateLibraryItem()
  const addListItem = useAddListItem()
  const createList = useCreateList()

  const existingItem = useMemo(
    () => library?.find((item) => item.mediaType === mediaType && item.tmdbId === tmdbId),
    [library, mediaType, tmdbId],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [destination, setDestination] = useState<'library' | 'list'>('library')
  const [selectedListId, setSelectedListId] = useState('')
  const [newListTitle, setNewListTitle] = useState('')
  const [newListVisibility, setNewListVisibility] = useState<Visibility>('Private')
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [isOpen])

  async function submitListItem() {
    if (!selectedListId) {
      toast.error('Elegi una lista', 'Selecciona una lista antes de agregar el contenido.')
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
      setIsOpen(false)
    } catch (error) {
      setListError(getErrorMessage(error, 'No se pudo agregar a la lista. Revisa la lista seleccionada e intenta de nuevo.'))
    }
  }

  async function submitQuickList() {
    if (!newListTitle.trim()) {
      toast.error('Falta el titulo', 'Escribi un nombre para crear la lista.')
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label={`Agregar ${title}`}
        title={`Agregar ${title}`}
        className="grid h-12 w-12 place-items-center rounded-full border border-violet-100/45 bg-white/12 text-3xl font-semibold leading-none text-white shadow-[0_18px_44px_rgba(124,58,237,0.34)] backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-100/70 hover:bg-white/18"
      >
        +
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar agregar"
            className="fixed inset-0 z-40 cursor-default bg-black/38 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="quick-actions-menu">
          {!isAuthenticated ? (
            <div>
              <p className="kicker">Tu espacio</p>
              <h2 className="mt-2 text-base font-semibold">Guardalo cuando quieras</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                La biblioteca guarda tu estado y rating. Las listas son colecciones privadas o publicas.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link to="/login" className="primary-action min-h-10">
                  Iniciar sesion
                </Link>
                <Link to="/register" className="secondary-action min-h-10">
                  Crear cuenta
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <label className="text-sm text-[var(--color-text-secondary)]">
                Destino
                <select value={destination} onChange={(event) => setDestination(event.target.value as 'library' | 'list')} className="field mt-2">
                  <option value="library">Biblioteca: estado, favorita y rating</option>
                  <option value="list">Lista: coleccion personalizada</option>
                </select>
              </label>

              {destination === 'library' ? (
                <QuickLibraryForm
                  key={existingItem?.id ?? `new-${mediaType}-${tmdbId}`}
                  mediaType={mediaType}
                  tmdbId={tmdbId}
                  existingItem={existingItem}
                  createPending={createLibraryItem.isPending}
                  updatePending={updateLibraryItem.isPending}
                  onCreate={(request) => createLibraryItem.mutateAsync(request)}
                  onUpdate={(id, request) => updateLibraryItem.mutateAsync({ id, request })}
                  onSaved={() => setIsOpen(false)}
                />
              ) : (
                <div>
                  {lists && lists.length > 0 ? (
                    <div className="grid gap-3">
                      <select value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)} className="field">
                        <option value="">Elegir lista</option>
                        {lists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.title} ({visibilityLabel(list.visibility)})
                          </option>
                        ))}
                      </select>
                      <button onClick={() => void submitListItem()} disabled={!selectedListId || addListItem.isPending} className="primary-action">
                        Agregar a lista
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Todavia no tenes listas. Crea una aca mismo.</p>
                  )}

                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
                    <input value={newListTitle} onChange={(event) => setNewListTitle(event.target.value)} placeholder="Nueva lista" className="field" />
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <select value={newListVisibility} onChange={(event) => setNewListVisibility(event.target.value as Visibility)} className="field">
                        {visibilityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => void submitQuickList()} disabled={!newListTitle.trim() || createList.isPending} className="secondary-action">
                        Crear
                      </button>
                    </div>
                  </div>
                  {listError ? <ActionError message={listError} /> : null}
                </div>
              )}
            </div>
          )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function MediaActionsPanel({ mediaType, tmdbId, title }: MediaActionsPanelProps) {
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)
  const { data: tmdbConnection } = useTmdbConnectionStatus(isAuthenticated)
  const { data: tmdbState } = useTmdbMediaState(mediaType, tmdbId, isAuthenticated && Boolean(tmdbConnection?.isConnected))
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useMediaReviews(mediaType, tmdbId)
  const createReview = useCreateReview()

  const existingItem = useMemo(
    () => library?.find((item) => item.mediaType === mediaType && item.tmdbId === tmdbId),
    [library, mediaType, tmdbId],
  )

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="surface-panel p-5">
          <p className="kicker">Cuenta</p>
          <h2 className="mt-2 text-xl font-semibold">Guarda y reseña {title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Inicia sesion para sumar este contenido a tu biblioteca, crear listas y dejar una reseña independiente.
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
    <section className="mx-auto max-w-7xl space-y-6 px-4 pb-16 sm:px-6">
      <TmdbMediaControls
        key={`${tmdbConnection?.isConnected ? 'connected' : 'disconnected'}-${tmdbState?.rating ?? 'none'}`}
        mediaType={mediaType}
        tmdbId={tmdbId}
        isConnected={Boolean(tmdbConnection?.isConnected)}
        state={tmdbState}
      />

      <ReviewComposer
        mediaType={mediaType}
        tmdbId={tmdbId}
        existingRating={existingItem?.rating ?? null}
        createPending={createReview.isPending}
        onCreate={(request) => createReview.mutateAsync(request)}
      />

      <ReviewsBlock reviews={reviews ?? []} isLoading={reviewsLoading} isError={reviewsError} />
    </section>
  )
}

function QuickLibraryForm({
  mediaType,
  tmdbId,
  existingItem,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
  onSaved,
}: {
  mediaType: MediaKind
  tmdbId: number
  existingItem: ExistingLibraryItem
  createPending: boolean
  updatePending: boolean
  onCreate: (request: LibraryItemRequest) => Promise<unknown>
  onUpdate: (id: string, request: LibraryItemRequest) => Promise<unknown>
  onSaved: () => void
}) {
  const [status, setStatus] = useState<WatchStatus>(existingItem?.status ?? 'WantToWatch')
  const [rating, setRating] = useState(formatLibraryRating(existingItem?.rating ?? null))
  const [isFavorite, setIsFavorite] = useState(existingItem?.isFavorite ?? false)
  const [error, setError] = useState<string | null>(null)

  const parsedRating = status === 'Watched' ? parseLibraryRating(rating) : null
  const ratingIsValid = status !== 'Watched' || (parsedRating !== null && Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 10)

  async function saveLibraryItem() {
    if (!ratingIsValid) {
      const message = 'Selecciona un rating para marcarla como vista.'
      setError(message)
      toast.error('Rating invalido', message)
      return
    }

    const request: LibraryItemRequest = {
      mediaType,
      tmdbId,
      status,
      isFavorite,
      rating: parsedRating,
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
      onSaved()
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'No se pudo guardar en tu biblioteca. Revisa los datos e intenta de nuevo.'))
    }
  }

  return (
    <div className="grid gap-3">
      <select value={status} onChange={(event) => setStatus(event.target.value as WatchStatus)} className="field">
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {status === 'Watched' ? (
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="field">
          <option value="">Elegir rating</option>
          {libraryRatingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <input
          checked={isFavorite}
          onChange={(event) => setIsFavorite(event.target.checked)}
          type="checkbox"
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Marcar como favorita
      </label>
      <button onClick={() => void saveLibraryItem()} disabled={createPending || updatePending} className="primary-action">
        {existingItem ? 'Actualizar biblioteca' : 'Guardar en biblioteca'}
      </button>
      {error ? <ActionError message={error} /> : null}
    </div>
  )
}

function ReviewComposer({
  mediaType,
  tmdbId,
  existingRating,
  createPending,
  onCreate,
}: {
  mediaType: MediaKind
  tmdbId: number
  existingRating: number | null
  createPending: boolean
  onCreate: (request: ReviewRequest) => Promise<unknown>
}) {
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewVisibility, setReviewVisibility] = useState<Visibility>('Public')
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const canSubmitReview = reviewTitle.trim().length > 0 && reviewBody.trim().length > 0

  async function submitReview() {
    if (!canSubmitReview) {
      const message = 'Completa titulo y reseña antes de publicar.'
      setReviewError(message)
      toast.error('Reseña incompleta', message)
      return
    }

    const request: ReviewRequest = {
      mediaType,
      tmdbId,
      ratingSnapshot: existingRating,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      containsSpoilers,
      visibility: reviewVisibility,
    }

    setReviewError(null)

    try {
      await onCreate(request)
      setReviewTitle('')
      setReviewBody('')
      setContainsSpoilers(false)
    } catch (error) {
      setReviewError(getErrorMessage(error, 'No se pudo publicar la reseña. Revisa los datos e intenta de nuevo.'))
    }
  }

  return (
    <div className="surface-panel p-5">
      <h2 className="text-xl font-semibold">Crear reseña</h2>
      <div className="mt-4 grid gap-3">
        <input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Titulo" className="field" />
        <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Tu reseña" rows={5} className="field" />
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
          <button onClick={() => void submitReview()} disabled={!canSubmitReview || createPending} className="primary-action">
            Publicar
          </button>
        </div>
      </div>
      {reviewError ? <ActionError message={reviewError} /> : null}
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
  const [rating, setRating] = useState(formatRatingValue(state?.rating ?? null))
  const [error, setError] = useState<string | null>(null)
  const parsedRating = parseRatingInput(rating)
  const ratingIsValid = parsedRating !== null && Number.isFinite(parsedRating) && parsedRating >= 0.5 && parsedRating <= 10

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
          inputMode="decimal"
          placeholder="Rating TMDB"
          className="field min-w-0 flex-1"
        />
        <button
          onClick={() => void runTmdbAction(() => rate.mutateAsync({ mediaType, tmdbId, value: parsedRating ?? 0 }))}
          disabled={!ratingIsValid || rate.isPending}
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
      <h2 className="text-xl font-semibold">Reseñas publicas</h2>
      {isLoading ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Cargando reseñas...</p> : null}
      {isError ? <p className="mt-3 text-sm text-red-200">No pudimos cargar reseñas.</p> : null}
      {!isLoading && !isError && reviews.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Todavia no hay reseñas publicas.</p>
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

function parseRatingInput(value: string) {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : Number.NaN
}

function formatRatingValue(value: number | null) {
  return value === null ? '' : String(value)
}

function visibilityLabel(value: Visibility) {
  return visibilityOptions.find((option) => option.value === value)?.label ?? value
}
