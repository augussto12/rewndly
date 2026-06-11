import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { BackButton } from '../components/navigation/BackButton'
import { useExternalRatingsBatch } from '../features/public-media/hooks/usePublicMedia'
import { formatExternalRating, getRatingsKey, ratingBySource, ratingValueForSort, toRatingsMap, type ExternalRatingSource } from '../features/public-media/utils/externalRatings'
import { useDeleteListItem, useListDetails } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'
import type { ExternalRating } from '../features/public-media/types/publicMedia.types'
import type { UserListItem } from '../features/user-content/types/userContent.types'

type ListSort = 'position' | 'rating-desc' | 'rating-asc' | 'title' | 'added' | `external-${ExternalRatingSource}`

export function ListDetailsPage() {
  const { id } = useParams()
  const { data, isError, isLoading } = useListDetails(id)
  const deleteItem = useDeleteListItem()
  const [actionError, setActionError] = useState<string | null>(null)
  const [sort, setSort] = useState<ListSort>('position')
  const externalSortSource = sort.startsWith('external-') ? (sort.replace('external-', '') as ExternalRatingSource) : null
  const externalRatings = useExternalRatingsBatch(data?.items ?? [], Boolean(externalSortSource))
  const ratingsMap = useMemo(() => toRatingsMap(externalRatings.data), [externalRatings.data])

  const sortedItems = useMemo(() => sortListItems(data?.items ?? [], sort, ratingsMap), [data?.items, ratingsMap, sort])

  async function removeItem(listId: string, itemId: string) {
    setActionError(null)

    try {
      await deleteItem.mutateAsync({ listId, itemId })
    } catch (error) {
      setActionError(getErrorMessage(error, 'No se pudo quitar el contenido de la lista. Puede que ya no exista o no pertenezca a tu cuenta.'))
    }
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState title="No pudimos cargar la lista" /> : null}
        {actionError ? <ActionError message={actionError} /> : null}
        {!isLoading && !isError && data ? (
          <>
            <header className="mb-8">
              <BackButton fallbackHref="/me/lists" />
              <h1 className="mt-5 text-4xl font-semibold">{data.title}</h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">{data.description || data.visibility}</p>
            </header>
            {data.items.length === 0 ? <EmptyState title="Lista vacía" message="Agregá contenido desde el detalle de película o serie." /> : null}
            {data.items.length > 0 ? (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-secondary)]">{data.items.length} items</p>
                <label className="text-sm text-[var(--color-text-secondary)] sm:w-64">
                  Ordenar
                  <select value={sort} onChange={(event) => setSort(event.target.value as ListSort)} className="field mt-2">
                    <option value="position">Orden de la lista</option>
                    <option value="rating-desc">Clasificación: mayor a menor</option>
                    <option value="rating-asc">Clasificación: menor a mayor</option>
                    <option value="external-IMDb">IMDb</option>
                    <option value="external-RottenTomatoes">Rotten Tomatoes</option>
                    <option value="external-Metacritic">Metacritic</option>
                    <option value="external-Letterboxd">Letterboxd</option>
                    <option value="title">Título</option>
                    <option value="added">Agregadas recientemente</option>
                  </select>
                </label>
              </div>
            ) : null}
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
                      {item.mediaType === 'Movie' ? 'Película' : 'Serie'} {item.rating ? `/ ${item.rating}/10` : '/ Sin clasificación'}
                    </p>
                    {externalSortSource ? <ExternalRatingLine item={item} ratingsMap={ratingsMap} source={externalSortSource} /> : null}
                    <button onClick={() => void removeItem(data.id, item.id)} className="secondary-action mt-auto min-h-9 self-start px-3 py-2 text-xs">
                      Quitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </PublicLayout>
  )
}

function sortListItems(items: UserListItem[], sort: ListSort, ratingsMap: Map<string, ExternalRating[]>) {
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

    if (sort === 'added') {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    }

    return (left.position ?? 0) - (right.position ?? 0)
  })
}

function ExternalRatingLine({
  item,
  ratingsMap,
  source,
}: {
  item: UserListItem
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

function ActionError({ message }: { message: string }) {
  return <p className="mb-6 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{message}</p>
}
