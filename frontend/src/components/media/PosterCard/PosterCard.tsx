import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from '../../feedback/Toast/toastStore'
import { useAuth } from '../../../features/auth/useAuth'
import { useCreateLibraryItem, useMyLibrary, useUpdateLibraryItem } from '../../../features/user-content/hooks/useUserContent'
import { formatLibraryRating, libraryRatingOptions, parseLibraryRating } from '../../../features/user-content/utils/ratingOptions'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'
import type { WatchStatus } from '../../../features/user-content/types/userContent.types'

type PosterCardProps = {
  item: MediaSummary
  layout?: 'grid' | 'carousel'
  rankLabel?: string
}

export function PosterCard({ item, layout = 'grid', rankLabel }: PosterCardProps) {
  const href = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
  const layoutClass =
    layout === 'carousel'
      ? 'min-w-[9.5rem] max-w-[9.5rem] shrink-0 sm:min-w-[11rem] sm:max-w-[11rem]'
      : 'min-w-0 w-full'

  return (
    <article className={`group rounded-[var(--radius-md)] ${layoutClass}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-200/28">
        <Link to={href} className="block h-full" aria-label={item.title}>
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">
              Sin poster
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/78 to-transparent opacity-80" />
          {rankLabel ? (
            <div className="absolute left-2 top-2 max-w-[calc(100%-4.25rem)] rounded-[var(--radius-sm)] border border-white/15 bg-black/72 px-2 py-1 text-[0.68rem] font-semibold text-white shadow-sm backdrop-blur">
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
        {item.releaseDate?.slice(0, 4) ?? (item.mediaType === 'Movie' ? 'Pelicula' : 'Serie')}
      </p>
    </article>
  )
}

function LibraryShortcutButton({ item }: { item: MediaSummary }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)
  const createLibraryItem = useCreateLibraryItem()
  const updateLibraryItem = useUpdateLibraryItem()
  const existingItem = library?.find((libraryItem) => libraryItem.mediaType === item.mediaType && libraryItem.tmdbId === item.tmdbId)
  const isSaved = Boolean(existingItem)
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Extract<WatchStatus, 'WantToWatch' | 'Watched'>>('WantToWatch')
  const [rating, setRating] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  function openLibraryPanel() {
    if (!isAuthenticated) {
      toast.info('Inicia sesion', 'Entra a tu cuenta para guardar contenido en tu biblioteca.')
      navigate('/login')
      return
    }

    setStatus(existingItem?.status === 'Watched' ? 'Watched' : 'WantToWatch')
    setRating(formatLibraryRating(existingItem?.rating ?? null))
    setIsOpen(true)
  }

  async function saveToLibrary() {
    const parsedRating = status === 'Watched' ? parseLibraryRating(rating) : null

    if (status === 'Watched' && (parsedRating === null || Number.isNaN(parsedRating))) {
      toast.error('Elegi un rating', 'Para marcarla como vista, selecciona una valoracion.')
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

    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openLibraryPanel}
        aria-label={isSaved ? `Editar ${item.title} en biblioteca` : `Agregar ${item.title} a biblioteca`}
        title={isSaved ? 'Editar biblioteca' : 'Agregar a biblioteca'}
        className={`absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border text-xl font-semibold leading-none shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur transition hover:-translate-y-0.5 ${
          isSaved
            ? 'border-emerald-200/35 bg-emerald-500/20 text-emerald-100'
            : 'border-violet-200/25 bg-black/62 text-white hover:border-violet-100/50 hover:bg-black/74'
        }`}
      >
        +
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Cerrar agregar a biblioteca"
            className="absolute inset-0 cursor-default bg-black/62 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[calc(100svh-1rem)] w-full overflow-y-auto rounded-t-[var(--radius-md)] border border-white/12 bg-[var(--color-surface)] p-4 shadow-2xl sm:inset-x-4 sm:bottom-6 sm:max-w-md sm:rounded-[var(--radius-md)] sm:p-5 md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="kicker">Biblioteca</p>
                <h2 className="mt-2 line-clamp-2 text-lg font-semibold">{item.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/80 hover:bg-white/[0.12]"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-white/10 bg-black/20 p-1">
                <button type="button" onClick={() => setStatus('WantToWatch')} className={segmentClass(status === 'WantToWatch')}>
                  Quiero ver
                </button>
                <button type="button" onClick={() => setStatus('Watched')} className={segmentClass(status === 'Watched')}>
                  Vista
                </button>
              </div>

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
      ) : null}
    </>
  )
}

function segmentClass(isActive: boolean) {
  return `min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${
    isActive ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
  }`
}
