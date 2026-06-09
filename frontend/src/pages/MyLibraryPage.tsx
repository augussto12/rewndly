import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useExternalRatingsBatch } from '../features/public-media/hooks/usePublicMedia'
import { formatExternalRating, getRatingsKey, ratingBySource, ratingValueForSort, toRatingsMap, type ExternalRatingSource } from '../features/public-media/utils/externalRatings'
import { useDeleteLibraryItem, useMyLibrary } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'
import type { ExternalRating } from '../features/public-media/types/publicMedia.types'
import type { LibraryItem, WatchStatus } from '../features/user-content/types/userContent.types'

type LibrarySort = 'updated' | 'rating-desc' | 'rating-asc' | 'title' | 'status' | `external-${ExternalRatingSource}`
type LibraryStatusFilter = 'all' | WatchStatus

const statusFilters: Array<{ value: LibraryStatusFilter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'WantToWatch', label: 'Quiero ver' },
  { value: 'Watching', label: 'Viendo' },
  { value: 'Watched', label: 'Vistos' },
  { value: 'Dropped', label: 'Abandonados' },
]

export function MyLibraryPage() {
  const { data, isError, isLoading } = useMyLibrary()
  const deleteItem = useDeleteLibraryItem()
  const [actionError, setActionError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>('all')
  const [sort, setSort] = useState<LibrarySort>('updated')
  const externalSortSource = sort.startsWith('external-') ? (sort.replace('external-', '') as ExternalRatingSource) : null
  const libraryItems = data ?? []
  const statusCounts = useMemo(() => countByStatus(libraryItems), [libraryItems])
  const filteredItems = useMemo(() => filterLibraryItems(libraryItems, statusFilter), [libraryItems, statusFilter])
  const externalRatings = useExternalRatingsBatch(filteredItems, Boolean(externalSortSource))
  const ratingsMap = useMemo(() => toRatingsMap(externalRatings.data), [externalRatings.data])

  const sortedItems = useMemo(() => sortLibraryItems(filteredItems, sort, ratingsMap), [filteredItems, ratingsMap, sort])

  async function removeItem(id: string) {
    setActionError(null)

    try {
      await deleteItem.mutateAsync(id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo quitar el contenido. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader title="Mi biblioteca" subtitle="Tu relacion personal con peliculas y series." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState title="Biblioteca vacia" message="Guarda contenido desde el detalle de una pelicula o serie." />
        ) : null}
        {!isLoading && !isError && data && data.length > 0 ? (
          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {filteredItems.length === data.length ? `${data.length} items` : `${filteredItems.length} de ${data.length} items`}
              </p>
              <div className="scrollbar-cinema -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {statusFilters.map((option) => {
                  const count = option.value === 'all' ? data.length : statusCounts.get(option.value) ?? 0
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={filterButtonClass(statusFilter === option.value)}
                    >
                      {option.label} <span className="text-white/55">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <label className="text-sm text-[var(--color-text-secondary)]">
              Ordenar
              <select value={sort} onChange={(event) => setSort(event.target.value as LibrarySort)} className="field mt-2">
                <option value="updated">Recientes</option>
                <option value="rating-desc">Clasificacion: mayor a menor</option>
                <option value="rating-asc">Clasificacion: menor a mayor</option>
                <option value="external-IMDb">IMDb</option>
                <option value="external-RottenTomatoes">Rotten Tomatoes</option>
                <option value="external-Metacritic">Metacritic</option>
                <option value="external-Letterboxd">Letterboxd</option>
                <option value="title">Titulo</option>
                <option value="status">Estado</option>
              </select>
            </label>
          </div>
        ) : null}
        {!isLoading && !isError && data && data.length > 0 && filteredItems.length === 0 ? (
          <EmptyState title="Sin contenido en este filtro" message="Cambia el estado para ver otros items de tu biblioteca." />
        ) : null}
        {filteredItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedItems.map((item) => (
              <article key={item.id} className="surface-panel flex min-h-28 gap-3 p-3">
                <Link
                  to={item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`}
                  className="h-24 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5 sm:h-28 sm:w-[4.7rem]"
                >
                  {item.posterUrl ? <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" /> : null}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`} className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{item.title}</h2>
                  </Link>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                    {statusLabel(item.status)} {item.rating ? `/ ${item.rating}/10` : '/ Sin clasificacion'}
                  </p>
                  {externalSortSource ? <ExternalRatingLine item={item} ratingsMap={ratingsMap} source={externalSortSource} /> : null}
                  <button onClick={() => void removeItem(item.id)} className="secondary-action mt-auto min-h-9 self-start px-3 py-2 text-xs">
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </PublicLayout>
  )
}

function countByStatus(items: LibraryItem[]) {
  return items.reduce((counts, item) => {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    return counts
  }, new Map<WatchStatus, number>())
}

function filterLibraryItems(items: LibraryItem[], status: LibraryStatusFilter) {
  if (status === 'all') {
    return items
  }

  return items.filter((item) => item.status === status)
}

function sortLibraryItems(items: LibraryItem[], sort: LibrarySort, ratingsMap: Map<string, ExternalRating[]>) {
  return [...items].sort((left, right) => {
    if (sort.startsWith('external-')) {
      const source = sort.replace('external-', '') as ExternalRatingSource
      const rightRatings = ratingsMap.get(getRatingsKey(right.mediaType, right.tmdbId))
      const leftRatings = ratingsMap.get(getRatingsKey(left.mediaType, left.tmdbId))
      return ratingValueForSort(rightRatings, source) - ratingValueForSort(leftRatings, source) || left.title.localeCompare(right.title)
    }

    if (sort === 'rating-desc') {
      return ratingValue(right.rating) - ratingValue(left.rating) || left.title.localeCompare(right.title)
    }

    if (sort === 'rating-asc') {
      return ratingValue(left.rating) - ratingValue(right.rating) || left.title.localeCompare(right.title)
    }

    if (sort === 'title') {
      return left.title.localeCompare(right.title)
    }

    if (sort === 'status') {
      return statusLabel(left.status).localeCompare(statusLabel(right.status)) || left.title.localeCompare(right.title)
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  })
}

function ExternalRatingLine({
  item,
  ratingsMap,
  source,
}: {
  item: LibraryItem
  ratingsMap: Map<string, ExternalRating[]>
  source: ExternalRatingSource
}) {
  const rating = ratingBySource(ratingsMap.get(getRatingsKey(item.mediaType, item.tmdbId)), source)
  const label = formatExternalRating(rating)

  if (!label) {
    return null
  }

  return <p className="mt-1 text-xs text-violet-100/80">{rating?.label}: {label}</p>
}

function ratingValue(value: number | null) {
  return value ?? -1
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    WantToWatch: 'Quiero ver',
    Watching: 'Viendo',
    Watched: 'Vista',
    Dropped: 'Abandonada',
  }

  return labels[value] ?? value
}

function filterButtonClass(active: boolean) {
  return [
    'shrink-0 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-semibold transition',
    active
      ? 'border-violet-200/45 bg-[var(--color-accent-soft)] text-white'
      : 'border-white/10 bg-white/[0.035] text-[var(--color-text-secondary)] hover:bg-white/[0.07] hover:text-white',
  ].join(' ')
}

function ActionError({ message }: { message: string }) {
  return <p className="mb-6 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <p className="kicker">Rewndly</p>
      <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">{subtitle}</p>
    </header>
  )
}
