import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { useExternalRatingsBatch, useWatchProvidersBatch } from '../features/public-media/hooks/usePublicMedia'
import {
  getRatingsKey,
  ratingValueForSort,
  toRatingsMap,
  type ExternalRatingSource,
} from '../features/public-media/utils/externalRatings'
import { useDeleteLibraryItem, useMyLibrary, useUpdateLibraryItem } from '../features/user-content/hooks/useUserContent'
import { formatLibraryRating, libraryRatingOptions, parseLibraryRating } from '../features/user-content/utils/ratingOptions'
import { ClearButton } from '../components/ui/ClearButton'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useClientPagination } from '../components/ui/useClientPagination'
import { PaginationFooter } from '../components/ui/PaginationFooter'
import { PublicLayout } from '../layouts/PublicLayout'
import type { LibraryItem, WatchStatus } from '../features/user-content/types/userContent.types'
import type { WatchProvider } from '../features/public-media/types/publicMedia.types'

type LibrarySort = 'updated' | 'rating-desc' | 'rating-asc' | 'title' | `external-${ExternalRatingSource}`
type StatusFilter = 'all' | 'WantToWatch' | 'Watching' | 'Watched'
type TypeFilter = 'all' | 'Movie' | 'Series'

const STATUS_OPTIONS: WatchStatus[] = ['WantToWatch', 'Watching', 'Watched']

const STATUS_LABELS: Record<string, string> = {
  WantToWatch: 'Quiero ver',
  Watching: 'Viendo',
  Watched: 'Vista',
  Dropped: 'Abandonada',
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
  const libraryItems = useMemo(() => data ?? [], [data])

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

  const pager = useClientPagination(sortedItems, 24)

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
    <PublicLayout ambient="catalog">
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
          <EmptyState
            title="Biblioteca vacía"
            message="Guardá contenido desde el detalle de una película o serie."
            action={
              <Link to="/discover" className="primary-action">
                Explorar catálogo
              </Link>
            }
          />
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
                  className={`field w-full pl-8 ${search ? 'pr-10' : ''}`}
                />
                {search ? <ClearButton onClick={() => setSearch('')} label="Borrar búsqueda" className="right-1.5" /> : null}
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
              <SegmentedControl
                ariaLabel="Vista"
                className="ml-auto"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'grid', label: 'Grilla' },
                  { value: 'list', label: 'Lista' },
                ]}
              />
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState title="Sin resultados" message="Cambiá los filtros para ver otros títulos." />
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid gap-3'}>
                  {pager.pagedItems.map((item) => (
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
                <PaginationFooter pager={pager} unit="títulos" />
              </>
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
  const navigate = useNavigate()
  const [providersOpen, setProvidersOpen] = useState(false)
  const mediaHref = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
  const isGrid = viewMode === 'grid'
  const vs = visibleStatus(item.status)
  const isActive = (s: WatchStatus) => item.status === s || (s === 'WantToWatch' && item.status === 'Dropped')
  const openMedia = () => navigate(mediaHref)
  const watchProviders = useWatchProvidersBatch(
    [{ mediaType: item.mediaType, tmdbId: item.tmdbId }],
    providersOpen,
  )
  const providers = watchProviders.data?.[0]?.providers

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openMedia}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter') {
          openMedia()
        }
      }}
      className={`surface-panel group relative cursor-pointer p-3 hover:border-violet-200/28 ${isGrid ? 'flex flex-col gap-3' : 'flex gap-3 sm:min-h-28'}`}
    >
      {/* Poster */}
      <div
        className={`shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5 ${isGrid ? 'aspect-[2/3] w-full' : 'h-[6.25rem] w-[4.15rem] sm:h-[7.5rem] sm:w-[5rem]'}`}
      >
        {item.posterUrl ? (
          <img src={item.posterUrl} alt="" className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Three-dot menu */}
        <div className={`absolute z-20 ${isGrid ? 'right-4 top-4' : 'right-2 top-2'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMenuToggle()
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition hover:text-white ${isGrid ? 'bg-black/55 text-white/80 hover:bg-black/70' : 'text-white/35 hover:bg-white/10'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-44 overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[#18152e] py-1 shadow-2xl"
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
        <h2 className={`line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-white ${isGrid ? '' : 'pr-8'}`}>{item.title}</h2>

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
              <span className="text-sm font-semibold text-amber-300">{formatRatingValue(item.rating)}</span>
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

        <ProviderPreview
          providers={providers}
          isError={watchProviders.isError}
          isLoading={providersOpen && (watchProviders.isLoading || watchProviders.isFetching)}
          isOpen={providersOpen}
          onToggle={() => setProvidersOpen((prev) => !prev)}
        />
      </div>
    </article>
  )
}

function ProviderPreview({
  providers,
  isError,
  isLoading,
  isOpen,
  onToggle,
}: {
  providers: WatchProvider[] | undefined
  isError: boolean
  isLoading: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const isInitialLoading = isLoading && providers === undefined

  return (
    <div className="mt-1 flex min-w-0 flex-col items-start gap-1.5" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        aria-busy={isInitialLoading}
        aria-expanded={isOpen}
        className="inline-flex h-[1.15rem] items-center gap-1 rounded border border-white/10 bg-white/[0.025] px-1.5 py-0 text-[0.58rem] font-medium leading-none text-white/58 transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-violet-100 sm:h-6 sm:px-2 sm:text-[0.64rem] sm:font-semibold"
      >
        {isInitialLoading ? (
          <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent sm:h-2.5 sm:w-2.5" />
        ) : (
          <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11h18M5 7h14M7 15h10M9 19h6" />
          </svg>
        )}
        <span>{isInitialLoading ? '...' : isOpen ? 'Cerrar' : 'Donde ver'}</span>
      </button>

      {isOpen ? <ProviderResults providers={providers} isError={isError} isLoading={isLoading} /> : null}
    </div>
  )
}

function ProviderResults({
  providers,
  isError,
  isLoading,
}: {
  providers: WatchProvider[] | undefined
  isError: boolean
  isLoading: boolean
}) {
  const [showAllProviders, setShowAllProviders] = useState(false)

  if (isLoading && providers === undefined) {
    return (
      <div className="flex max-w-full items-center gap-1.5 rounded-[var(--radius-sm)] border border-white/[0.06] bg-black/20 px-1.5 py-1 text-[0.68rem] text-white/42 sm:gap-2 sm:px-2 sm:py-1.5 sm:text-xs">
        <span className="h-3 w-3 animate-spin rounded-full border border-violet-200/70 border-t-transparent sm:h-3.5 sm:w-3.5" />
        <span>Consultando proveedores...</span>
      </div>
    )
  }

  if (isError) {
    return <span className="text-xs text-red-300/70">No se pudo consultar.</span>
  }

  if (!providers || providers.length === 0) {
    return <span className="text-xs text-white/35">Sin plataformas para verla por ahora.</span>
  }

  const sortedProviders = sortProviders(providers)
  const visibleProviders = showAllProviders ? sortedProviders : sortedProviders.slice(0, 3)
  const hiddenCount = Math.max(0, sortedProviders.length - visibleProviders.length)
  const hasHiddenProviders = sortedProviders.length > 3

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-white/35">Ver en</span>
      {visibleProviders.map((provider) => (
        <span
          key={`${provider.type}-${provider.providerId}`}
          className="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-sm)] border border-white/10 bg-black/20 px-1.5 py-0.5 text-[0.66rem] font-medium text-white/72 sm:gap-1.5 sm:py-1 sm:text-[0.68rem]"
          title={`${provider.name} (${provider.type})`}
        >
          {provider.logoUrl ? <img src={provider.logoUrl} alt="" className="h-3.5 w-3.5 rounded object-cover sm:h-4 sm:w-4" loading="lazy" /> : null}
          <span className="max-w-[5.25rem] truncate sm:max-w-[6rem]">{provider.name}</span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setShowAllProviders(true)
          }}
          className="rounded-[var(--radius-sm)] border border-violet-300/25 bg-violet-400/10 px-2 py-1 text-[0.66rem] font-semibold text-violet-100/80 transition hover:border-violet-300/45 hover:bg-violet-400/20 hover:text-violet-100 sm:text-[0.68rem]"
          aria-label={`Mostrar ${hiddenCount} plataformas más`}
        >
          +{hiddenCount} más
        </button>
      ) : hasHiddenProviders ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setShowAllProviders(false)
          }}
          className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.66rem] font-medium text-white/52 transition hover:border-white/20 hover:text-white/80 sm:text-[0.68rem]"
        >
          Ver menos
        </button>
      ) : null}
    </div>
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
  const [rating, setRating] = useState(formatLibraryRating(markWatched ? null : item.rating))
  const heading = markWatched ? 'Marcar como vista' : 'Puntuación'

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 cursor-default bg-black/62 backdrop-blur-sm" onClick={onCancel} />
      <div role="dialog" aria-modal="true" aria-label={heading} className="relative m-3 w-full max-w-xs rounded-[var(--radius-md)] border border-white/12 bg-[var(--color-surface)] p-6 shadow-2xl sm:m-0">
        <h2 className="text-base font-semibold">{heading}</h2>
        <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">{item.title}</p>

        <label className="mt-4 block text-sm text-[var(--color-text-secondary)]">
          {markWatched ? '¿Qué puntuación le das?' : 'Tu puntuación'} <span className="opacity-60">Podés dejar vacío.</span>
          <select value={rating} onChange={(event) => setRating(event.target.value)} className="field mt-2" autoFocus>
            <option value="">Sin puntuación</option>
            {libraryRatingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="secondary-action flex-1 py-2 text-sm">
            Cancelar
          </button>
          <button onClick={() => onConfirm(parseLibraryRating(rating))} className="primary-action flex-1 py-2 text-sm">
            {markWatched ? 'Marcar vista' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function sortProviders(providers: WatchProvider[]) {
  const order: Record<string, number> = {
    Streaming: 0,
    Alquiler: 1,
    Compra: 2,
  }

  return [...providers]
    .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || a.name.localeCompare(b.name))
}

function formatRatingValue(value: number | null) {
  if (value === null) {
    return ''
  }

  return value.toLocaleString('es-AR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })
}
