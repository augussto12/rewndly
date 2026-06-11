import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { useExternalRatingsBatch } from '../features/public-media/hooks/usePublicMedia'
import {
  getRatingsKey,
  ratingValueForSort,
  toRatingsMap,
  type ExternalRatingSource,
} from '../features/public-media/utils/externalRatings'
import { useDeleteLibraryItem, useMyLibrary, useUpdateLibraryItem } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'
import type { LibraryItem, WatchStatus } from '../features/user-content/types/userContent.types'

type LibrarySort = 'updated' | 'rating-desc' | 'rating-asc' | 'title' | `external-${ExternalRatingSource}`
type StatusFilter = 'all' | 'WantToWatch' | 'Watching' | 'Watched'
type TypeFilter = 'all' | 'Movie' | 'Series'

const STATUS_OPTIONS: WatchStatus[] = ['WantToWatch', 'Watching', 'Watched']

const STATUS_LABELS: Record<string, string> = {
  WantToWatch: 'Quiero ver',
  Watching: 'Viendo',
  Watched: 'Vista',
  Dropped: 'Quiero ver',
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'WantToWatch', label: 'Quiero ver' },
  { value: 'Watching', label: 'Viendo' },
  { value: 'Watched', label: 'Vistos' },
]

function visibleStatus(status: WatchStatus): StatusFilter {
  return status === 'Dropped' ? 'WantToWatch' : status
}

function statusChipClass(status: StatusFilter) {
  if (status === 'Watched') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
  if (status === 'Watching') return 'bg-violet-500/15 text-violet-300 border-violet-500/25'
  return 'bg-white/5 text-white/40 border-white/10'
}

export function MyLibraryPage() {
  const { data, isError, isLoading } = useMyLibrary()
  const updateItem = useUpdateLibraryItem()
  const deleteItem = useDeleteLibraryItem()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState<LibrarySort>('updated')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<{ item: LibraryItem; markWatched: boolean } | null>(null)

  const externalSortSource = sort.startsWith('external-') ? (sort.replace('external-', '') as ExternalRatingSource) : null
  const libraryItems = data ?? []

  const statusCounts = useMemo(() => {
    const c = { all: libraryItems.length, WantToWatch: 0, Watching: 0, Watched: 0 }
    for (const item of libraryItems) {
      const vs = visibleStatus(item.status)
      if (vs in c) c[vs as keyof typeof c]++
    }
    return c
  }, [libraryItems])

  const filteredItems = useMemo(() => {
    let items = libraryItems
    if (statusFilter !== 'all') {
      items = items.filter((i) => visibleStatus(i.status) === statusFilter)
    }
    if (typeFilter !== 'all') {
      items = items.filter((i) => i.mediaType === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => i.title.toLowerCase().includes(q))
    }
    const min = minRating ? parseInt(minRating, 10) : null
    if (min !== null) {
      items = items.filter((i) => i.rating !== null && i.rating >= min)
    }
    return items
  }, [libraryItems, statusFilter, typeFilter, search, minRating])

  const externalRatings = useExternalRatingsBatch(filteredItems, Boolean(externalSortSource))
  const ratingsMap = useMemo(() => toRatingsMap(externalRatings.data), [externalRatings.data])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (externalSortSource) {
        const ra = ratingsMap.get(getRatingsKey(a.mediaType, a.tmdbId))
        const rb = ratingsMap.get(getRatingsKey(b.mediaType, b.tmdbId))
        return ratingValueForSort(rb, externalSortSource) - ratingValueForSort(ra, externalSortSource) || a.title.localeCompare(b.title)
      }
      if (sort === 'rating-desc') return (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title)
      if (sort === 'rating-asc') return (a.rating ?? -1) - (b.rating ?? -1) || a.title.localeCompare(b.title)
      if (sort === 'title') return a.title.localeCompare(b.title)
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    })
  }, [filteredItems, ratingsMap, sort, externalSortSource])

  async function handleStatusChange(item: LibraryItem, newStatus: WatchStatus) {
    setOpenMenuId(null)
    if (newStatus === 'Watched') {
      setRatingModal({ item, markWatched: true })
      return
    }
    await updateItem.mutateAsync({
      id: item.id,
      request: {
        mediaType: item.mediaType,
        tmdbId: item.tmdbId,
        status: newStatus,
        isFavorite: item.isFavorite,
        rating: item.rating,
        watchedAt: item.watchedAt,
        startedAt: item.startedAt,
      },
    })
  }

  async function handleRatingConfirm(rating: number | null) {
    if (!ratingModal) return
    const { item, markWatched } = ratingModal
    await updateItem.mutateAsync({
      id: item.id,
      request: {
        mediaType: item.mediaType,
        tmdbId: item.tmdbId,
        status: markWatched ? 'Watched' : item.status,
        isFavorite: item.isFavorite,
        rating,
        watchedAt: markWatched ? new Date().toISOString() : item.watchedAt,
        startedAt: item.startedAt,
      },
    })
    setRatingModal(null)
  }

  async function handleRemove(id: string) {
    setOpenMenuId(null)
    await deleteItem.mutateAsync(id)
  }

  function handleEditRating(item: LibraryItem) {
    setOpenMenuId(null)
    setRatingModal({ item, markWatched: false })
  }

  const hasData = !isLoading && !isError && data && data.length > 0

  return (
    <PublicLayout>
      {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />}

      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Rewndly</p>
          <h1 className="mt-3 text-4xl font-semibold">Mi biblioteca</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Tu relación personal con películas y series.</p>
        </header>

        {isLoading && <LoadingSkeleton />}
        {isError && <ErrorState />}

        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState title="Biblioteca vacía" message="Guardá contenido desde el detalle de una película o serie." />
        )}

        {hasData && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <LibraryStat label="Vistas" value={statusCounts.Watched} />
              <LibraryStat label="Viendo" value={statusCounts.Watching} />
              <LibraryStat label="Pendientes" value={statusCounts.WantToWatch} />
            </div>

            {/* Status tabs */}
            <div className="scrollbar-cinema -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {STATUS_TABS.map((tab) => (
                <FilterChip
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  active={statusFilter === tab.value}
                  count={statusCounts[tab.value]}
                >
                  {tab.label}
                </FilterChip>
              ))}
            </div>

            {/* Filter bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-44 flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Buscar título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field w-full pl-8"
                />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="field">
                <option value="all">Tipo: Todos</option>
                <option value="Movie">Películas</option>
                <option value="Series">Series</option>
              </select>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="field">
                <option value="">Puntuación mínima</option>
                <option value="5">5+ / 10</option>
                <option value="6">6+ / 10</option>
                <option value="7">7+ / 10</option>
                <option value="8">8+ / 10</option>
                <option value="9">9+ / 10</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)} className="field">
                <option value="updated">Recientes</option>
                <option value="rating-desc">Puntuación: mayor</option>
                <option value="rating-asc">Puntuación: menor</option>
                <option value="title">Título A-Z</option>
                <option value="external-IMDb">IMDb</option>
                <option value="external-RottenTomatoes">Rotten Tomatoes</option>
                <option value="external-Metacritic">Metacritic</option>
                <option value="external-Letterboxd">Letterboxd</option>
              </select>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {filteredItems.length === libraryItems.length
                  ? formatTitleCount(libraryItems.length)
                  : `${filteredItems.length} de ${libraryItems.length}`}
              </span>
              <div className="ml-auto grid grid-cols-2 rounded-[var(--radius-sm)] border border-white/10 bg-black/20 p-1">
                <button type="button" onClick={() => setViewMode('grid')} className={`rounded px-3 py-1.5 text-xs font-semibold ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[var(--color-text-secondary)]'}`}>
                  Grilla
                </button>
                <button type="button" onClick={() => setViewMode('list')} className={`rounded px-3 py-1.5 text-xs font-semibold ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[var(--color-text-secondary)]'}`}>
                  Lista
                </button>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState title="Sin resultados" message="Cambiá los filtros para ver otros títulos." />
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid gap-3'}>
                {sortedItems.map((item) => (
                  <LibraryCard
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    menuOpen={openMenuId === item.id}
                    onMenuToggle={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
                    onStatusChange={handleStatusChange}
                    onEditRating={handleEditRating}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {ratingModal && (
        <RatingModal
          item={ratingModal.item}
          markWatched={ratingModal.markWatched}
          onConfirm={handleRatingConfirm}
          onCancel={() => setRatingModal(null)}
        />
      )}
    </PublicLayout>
  )
}

function LibraryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-panel-muted p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}

function formatTitleCount(count: number) {
  return count === 1 ? '1 título' : `${count} títulos`
}

function LibraryCard({
  item,
  viewMode,
  menuOpen,
  onMenuToggle,
  onStatusChange,
  onEditRating,
  onRemove,
}: {
  item: LibraryItem
  viewMode: 'grid' | 'list'
  menuOpen: boolean
  onMenuToggle: () => void
  onStatusChange: (item: LibraryItem, status: WatchStatus) => void
  onEditRating: (item: LibraryItem) => void
  onRemove: (id: string) => void
}) {
  const mediaHref = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
  const vs = visibleStatus(item.status)
  const isActive = (s: WatchStatus) => item.status === s || (s === 'WantToWatch' && item.status === 'Dropped')

  return (
    <article className={`surface-panel relative flex gap-3 p-3 ${viewMode === 'list' ? 'sm:min-h-28' : ''}`}>
      {/* Poster */}
      <Link
        to={mediaHref}
        className={`${viewMode === 'list' ? 'h-[6.25rem] w-[4.15rem]' : 'h-[7.5rem] w-[5rem]'} shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5`}
      >
        {item.posterUrl ? (
          <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Three-dot menu */}
        <div className="absolute right-2 top-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMenuToggle()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-44 overflow-hidden rounded-[var(--radius)] border border-white/10 bg-[#18152e] py-1 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(item, s)}
                  className={[
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/[0.06]',
                    isActive(s) ? 'text-violet-300' : 'text-[var(--color-text-secondary)]',
                  ].join(' ')}
                >
                  <span className="w-3.5 text-center text-xs opacity-60">
                    {s === 'Watched' ? '✓' : s === 'Watching' ? '▶' : '○'}
                  </span>
                  {STATUS_LABELS[s]}
                  {isActive(s) && (
                    <svg className="ml-auto shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                type="button"
                onClick={() => onEditRating(item)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] transition hover:bg-white/[0.06]"
              >
                <span className="w-3.5 text-center text-xs opacity-60">★</span>
                Editar puntuación
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-400/75 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <svg className="w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={mediaHref} className="pr-8">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</h2>
        </Link>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/45">
            {item.mediaType === 'Movie' ? 'Película' : 'Serie'}
          </span>
          <span className={`rounded border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ${statusChipClass(vs)}`}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>

        {/* Rating (clickable to edit) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEditRating(item)
          }}
          className="mt-auto flex items-center gap-1 self-start transition hover:opacity-80"
          title="Editar puntuación"
        >
          {item.rating !== null ? (
            <>
              <svg className="text-amber-400" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
              <span className="text-sm font-semibold text-amber-300">{item.rating}</span>
              <span className="text-xs text-white/35">/10</span>
            </>
          ) : (
            <>
              <svg className="text-white/20" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
              <span className="text-xs text-white/30">Sin puntuación</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}

function RatingModal({
  item,
  markWatched,
  onConfirm,
  onCancel,
}: {
  item: LibraryItem
  markWatched: boolean
  onConfirm: (rating: number | null) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<number | null>(markWatched ? null : item.rating)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="surface-panel w-full max-w-xs p-6">
        <h2 className="text-base font-semibold">
          {markWatched ? 'Marcar como vista' : 'Puntuación'}
        </h2>
        <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{item.title}</p>

        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {markWatched ? '¿Qué puntuación le das?' : 'Cambiá tu puntuación.'}{' '}
          <span className="opacity-60">Podés dejar vacío.</span>
        </p>

        {/* 1–10 grid */}
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSelected((prev) => (prev === n ? null : n))}
              className={[
                'rounded-[var(--radius-sm)] border py-2 text-sm font-semibold transition',
                selected === n
                  ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 bg-white/[0.04] text-[var(--color-text-secondary)] hover:border-white/25 hover:text-white',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="secondary-action flex-1 py-2 text-sm">
            Cancelar
          </button>
          <button onClick={() => onConfirm(selected)} className="primary-action flex-1 py-2 text-sm">
            {markWatched ? 'Marcar vista' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
