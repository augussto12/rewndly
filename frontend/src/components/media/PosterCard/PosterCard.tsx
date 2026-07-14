import { memo, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { toast } from '../../feedback/Toast/toastStore'
import { useAuth } from '../../../features/auth/useAuth'
import { FadeInImage } from '../../ui/FadeInImage'
import { useLibraryEntry } from '../../../features/user-content/LibraryLookupContext'
import { useCreateLibraryItem, useUpdateLibraryItem } from '../../../features/user-content/hooks/useUserContent'
import { formatLibraryRating, libraryRatingOptions, parseLibraryRating } from '../../../features/user-content/utils/ratingOptions'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'
import type { LibraryItem, WatchStatus } from '../../../features/user-content/types/userContent.types'

type PosterCardProps = {
  item: MediaSummary
  layout?: 'grid' | 'carousel'
  rankLabel?: string
}

// TMDB serves posters at w500; on a grid/carousel they render ~150-190px wide,
// so the lighter w342 render halves decode cost with no visible difference.
function toCardPosterUrl(url: string | null) {
  return url ? url.replace('/w500/', '/w342/') : url
}

function PosterCardComponent({ item, layout = 'grid', rankLabel }: PosterCardProps) {
  const href = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
  const layoutClass =
    layout === 'carousel'
      ? 'min-w-[9.5rem] max-w-[9.5rem] shrink-0 sm:min-w-[11rem] sm:max-w-[11rem]'
      : 'min-w-0 w-full'
  const posterSrc = toCardPosterUrl(item.posterUrl)

  return (
    <article className={`group rounded-[var(--radius-md)] ${layout === 'grid' ? 'media-card-cv' : ''} ${layoutClass}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-200/28">
        <Link to={href} className="block h-full" aria-label={item.title}>
          {posterSrc ? (
            <FadeInImage
              src={posterSrc}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">
              Sin póster
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/78 to-transparent opacity-80" />
          {rankLabel ? (
            <div className="absolute left-2 top-2 max-w-[calc(100%-4.25rem)] rounded-[var(--radius-sm)] border border-white/15 bg-black/80 px-2 py-1 text-[0.68rem] font-semibold text-white shadow-sm">
              {rankLabel}
            </div>
          ) : null}
        </Link>
        <LibraryShortcutButton item={item} />
      </div>
      <Link to={href} className="block">
        <h3 className="mt-3 line-clamp-2 break-words text-sm font-semibold leading-snug text-white">{item.title}</h3>
      </Link>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        {item.releaseDate?.slice(0, 4) ?? (item.mediaType === 'Movie' ? 'Película' : 'Serie')}
      </p>
    </article>
  )
}

export const PosterCard = memo(PosterCardComponent)

function LibraryShortcutButton({ item }: { item: MediaSummary }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const existingItem = useLibraryEntry(item.mediaType, item.tmdbId)
  const isSaved = Boolean(existingItem)
  const [isOpen, setIsOpen] = useState(false)

  function openLibraryPanel() {
    if (!isAuthenticated) {
      toast.info('Iniciá sesión', 'Entrá a tu cuenta para guardar contenido en tu biblioteca.')
      navigate('/login')
      return
    }

    setIsOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openLibraryPanel}
        aria-label={isSaved ? `Editar ${item.title} en biblioteca` : `Agregar ${item.title} a biblioteca`}
        title={isSaved ? 'Editar biblioteca' : 'Agregar a biblioteca'}
        className={`absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border shadow-[0_10px_24px_rgba(0,0,0,0.34)] transition hover:-translate-y-0.5 ${
          isSaved
            ? 'border-emerald-200/35 bg-emerald-500/25 text-emerald-100'
            : 'border-violet-200/25 bg-black/72 text-white hover:border-violet-100/50 hover:bg-black/85'
        }`}
      >
        {isSaved ? (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        ) : (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        )}
      </button>

      {isOpen ? <LibraryQuickPanel item={item} existingItem={existingItem} onClose={() => setIsOpen(false)} /> : null}
    </>
  )
}

function LibraryQuickPanel({ item, existingItem, onClose }: { item: MediaSummary; existingItem: LibraryItem | undefined; onClose: () => void }) {
  const createLibraryItem = useCreateLibraryItem()
  const updateLibraryItem = useUpdateLibraryItem()
  const [status, setStatus] = useState<Extract<WatchStatus, 'WantToWatch' | 'Watched'>>(
    existingItem?.status === 'Watched' ? 'Watched' : 'WantToWatch',
  )
  const [rating, setRating] = useState(formatLibraryRating(existingItem?.rating ?? null))

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  async function saveToLibrary() {
    const parsedRating = status === 'Watched' ? parseLibraryRating(rating) : null

    if (status === 'Watched' && (parsedRating === null || Number.isNaN(parsedRating))) {
      toast.error('Elegí una valoración', 'Para marcarla como vista, seleccioná una puntuación.')
      return
    }

    const request = {
      mediaType: item.mediaType,
      tmdbId: item.tmdbId,
      status,
      isFavorite: existingItem?.isFavorite ?? false,
      rating: parsedRating,
      watchedAt: status === 'Watched' ? new Date().toISOString() : null,
      startedAt: null,
    }

    if (existingItem) {
      await updateLibraryItem.mutateAsync({ id: existingItem.id, request })
    } else {
      await createLibraryItem.mutateAsync(request)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Cerrar agregar a biblioteca"
        className="absolute inset-0 cursor-default bg-black/62 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[calc(100svh-1rem)] w-full overflow-y-auto rounded-t-[var(--radius-md)] border border-white/12 bg-[var(--color-surface)] p-4 shadow-2xl sm:inset-x-4 sm:bottom-6 sm:max-w-md sm:rounded-[var(--radius-md)] sm:p-5 md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Biblioteca</p>
            <h2 className="mt-2 line-clamp-2 text-lg font-semibold">{item.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/80 hover:bg-white/[0.12]"
            aria-label="Cerrar"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <SegmentedControl
            ariaLabel="Estado"
            size="lg"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'WantToWatch', label: 'Quiero ver' },
              { value: 'Watched', label: 'Vista' },
            ]}
          />

          {status === 'Watched' ? (
            <label className="text-sm text-[var(--color-text-secondary)]">
              Tu rating
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="field mt-2">
                <option value="">Elegir rating</option>
                {libraryRatingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => void saveToLibrary()}
            disabled={createLibraryItem.isPending || updateLibraryItem.isPending}
            className="primary-action"
          >
            {existingItem ? 'Actualizar biblioteca' : 'Guardar en biblioteca'}
          </button>
        </div>
      </div>
    </div>
  )
}
