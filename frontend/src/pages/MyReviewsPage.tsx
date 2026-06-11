import { useState, type FormEvent, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { VisibilityChip } from '../features/user-content/components/VisibilityChip'
import { useDeleteReview, useMyReviews, useUpdateReview } from '../features/user-content/hooks/useUserContent'
import type { Review, Visibility } from '../features/user-content/types/userContent.types'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

type ReviewEditValues = {
  title: string
  body: string
  ratingSnapshot: number | null
  containsSpoilers: boolean
  visibility: Visibility
}

export function MyReviewsPage() {
  const { data, isError, isLoading } = useMyReviews()
  const deleteReview = useDeleteReview()
  const updateReview = useUpdateReview()
  const [actionError, setActionError] = useState<string | null>(null)
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(() => new Set())
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  function toggleExpanded(id: string) {
    setExpandedReviewIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  async function removeReview(id: string) {
    setActionError(null)

    try {
      await deleteReview.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo eliminar la reseña. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  async function saveReviewEdit(review: Review, values: ReviewEditValues) {
    setActionError(null)

    try {
      await updateReview.mutateAsync({
        id: review.id,
        request: {
          mediaType: review.mediaType,
          tmdbId: review.tmdbId,
          ratingSnapshot: values.ratingSnapshot,
          title: values.title,
          body: values.body,
          containsSpoilers: values.containsSpoilers,
          visibility: values.visibility,
        },
      })
      setEditingReview(null)
      return true
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo actualizar la reseña. Revisá los datos e intentá de nuevo.'))
      return false
    }
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Reseñas</p>
          <h1 className="mt-3 text-4xl font-semibold">Mis reseñas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Textos independientes de tu biblioteca personal.</p>
        </header>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState title="Sin reseñas" message="Creá una reseña desde el detalle de una película o serie." />
        ) : null}
        <div className="grid gap-4">
          {data?.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              expanded={expandedReviewIds.has(review.id)}
              isDeleting={deleteReview.isPending}
              onToggleExpanded={() => toggleExpanded(review.id)}
              onEdit={() => setEditingReview(review)}
              onRemove={() => void removeReview(review.id)}
            />
          ))}
        </div>
      </main>

      {editingReview ? (
        <ReviewEditDialog
          review={editingReview}
          isSaving={updateReview.isPending}
          onCancel={() => setEditingReview(null)}
          onSave={saveReviewEdit}
        />
      ) : null}
    </PublicLayout>
  )
}

function ReviewCard({
  review,
  expanded,
  isDeleting,
  onToggleExpanded,
  onEdit,
  onRemove,
}: {
  review: Review
  expanded: boolean
  isDeleting: boolean
  onToggleExpanded: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  const mediaHref = getMediaHref(review)
  const isLongReview = review.body.length > 360

  return (
    <article className="surface-panel grid gap-4 p-4 transition hover:border-violet-200/20 sm:grid-cols-[5.25rem_1fr] sm:p-5">
      <Link
        to={mediaHref}
        className="h-32 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] shadow-[0_16px_36px_rgba(0,0,0,0.28)] sm:h-[7.75rem] sm:w-[5.25rem]"
        aria-label={review.mediaTitle}
      >
        {review.posterUrl ? (
          <img src={review.posterUrl} alt={review.mediaTitle} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <PosterFallback mediaType={review.mediaType} />
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={mediaHref} className="line-clamp-1 font-semibold text-violet-100 underline-offset-4 hover:text-white hover:underline">
            {review.mediaTitle}
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {review.mediaType === 'Movie' ? 'Película' : 'Serie'}
          </span>
          <VisibilityChip value={review.visibility} />
          {review.containsSpoilers ? (
            <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Spoilers
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-xl font-semibold">{review.title}</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Actualizada {formatDate(review.updatedAt)}</p>
          </div>
          <RatingPill rating={review.ratingSnapshot} />
        </div>

        <p className={`mt-3 text-sm leading-6 text-[var(--color-text-secondary)] ${expanded ? '' : 'line-clamp-4'}`}>{review.body}</p>
        {isLongReview ? (
          <button type="button" onClick={onToggleExpanded} className="mt-2 text-sm font-semibold text-violet-200 underline-offset-4 hover:underline">
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="secondary-action min-h-9 px-3 py-2 text-xs">
            <EditIcon />
            Editar
          </button>
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
      </div>
    </article>
  )
}

function ReviewEditDialog({
  review,
  isSaving,
  onCancel,
  onSave,
}: {
  review: Review
  isSaving: boolean
  onCancel: () => void
  onSave: (review: Review, values: ReviewEditValues) => Promise<boolean>
}) {
  const [title, setTitle] = useState(review.title)
  const [body, setBody] = useState(review.body)
  const [rating, setRating] = useState(review.ratingSnapshot === null ? '' : String(review.ratingSnapshot))
  const [visibility, setVisibility] = useState<Visibility>(review.visibility)
  const [containsSpoilers, setContainsSpoilers] = useState(review.containsSpoilers)
  const [localError, setLocalError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    const parsedRating = rating.trim() ? Number(rating) : null
    if (parsedRating !== null && (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 10)) {
      setLocalError('El rating debe estar entre 1 y 10.')
      return
    }

    if (!title.trim() || !body.trim()) {
      setLocalError('Completá título y cuerpo de la reseña.')
      return
    }

    await onSave(review, {
      title: title.trim(),
      body: body.trim(),
      ratingSnapshot: parsedRating,
      containsSpoilers,
      visibility,
    })
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" aria-label="Cerrar editor" className="absolute inset-0 cursor-default" onClick={onCancel} />
      <form
        onSubmit={submit}
        className="surface-panel relative max-h-[calc(100svh-1rem)] w-full max-w-2xl overflow-y-auto rounded-b-none p-5 shadow-2xl sm:rounded-[var(--radius-md)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Editar reseña</p>
            <h2 className="mt-2 text-2xl font-semibold">{review.mediaTitle}</h2>
          </div>
          <button type="button" onClick={onCancel} className="secondary-action min-h-9 px-3 py-2 text-xs">
            Cancelar
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="block text-sm text-[var(--color-text-secondary)]">
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="field mt-2" maxLength={180} />
          </label>

          <label className="block text-sm text-[var(--color-text-secondary)]">
            Reseña
            <textarea value={body} onChange={(event) => setBody(event.target.value)} className="field mt-2 min-h-40 resize-y" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Rating
              <input value={rating} onChange={(event) => setRating(event.target.value)} type="number" min="1" max="10" step="0.5" className="field mt-2" />
            </label>
            <label className="block text-sm text-[var(--color-text-secondary)]">
              Visibilidad
              <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="field mt-2">
                <option value="Public">Pública</option>
                <option value="FriendsOnly">Solo amigos</option>
                <option value="Private">Privada</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={containsSpoilers} onChange={(event) => setContainsSpoilers(event.target.checked)} />
            Contiene spoilers
          </label>

          {localError ? <ActionError message={localError} /> : null}

          <button type="submit" disabled={isSaving} className="primary-action">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

function RatingPill({ rating }: { rating: number | null }) {
  if (rating === null) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
        <StarIcon />
        Sin rating
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-100">
      <StarIcon className="text-amber-300" />
      {rating}/10
    </span>
  )
}

function PosterFallback({ mediaType }: { mediaType: Review['mediaType'] }) {
  return (
    <div className="grid h-full place-items-center px-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
      <FilmIcon />
      <span className="mt-2">{mediaType === 'Movie' ? 'Película' : 'Serie'}</span>
    </div>
  )
}

function getMediaHref(review: Review) {
  return review.mediaType === 'Movie' ? `/movies/${review.tmdbId}` : `/series/${review.tmdbId}`
}

function formatDate(value: string) {
  return value.slice(0, 10)
}

function ActionError({ message }: { message: string }) {
  return <p className="mb-6 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z" />
    </svg>
  )
}

function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

function FilmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <path d="M8 2v20M16 2v20M3 7h5M3 17h5M16 7h5M16 17h5" />
    </svg>
  )
}
