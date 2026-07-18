import { useMemo, useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { MediaGridSkeleton } from '../components/feedback/GridSkeleton/GridSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import {
  useMovieCalendarPages,
  useSeriesCalendarPages,
} from '../features/public-media/hooks/usePublicMedia'
import type { MediaSummary } from '../features/public-media/types/publicMedia.types'
import { PublicLayout } from '../layouts/PublicLayout'
import {
  addDays,
  dayLabel,
  endOfMonth,
  monthLabel,
  parseDateKey,
  rangeLabel,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from '../lib/date'
import { flattenUniquePages } from '../lib/pagination'

type CalendarView = 'week' | 'month'
type CalendarType = 'all' | 'movies' | 'series'

const mediaKey = (item: MediaSummary) => `${item.mediaType}-${item.tmdbId}`

export function CalendarioPage() {
  const [view, setView] = useState<CalendarView>('week')
  const [type, setType] = useState<CalendarType>('all')
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const { from, to } = useMemo(() => resolveWindow(view, anchor), [view, anchor])
  const fromKey = toDateKey(from)
  const toKey = toDateKey(to)

  const movies = useMovieCalendarPages(fromKey, toKey, type !== 'series')
  const series = useSeriesCalendarPages(fromKey, toKey, type !== 'movies')

  // Memoizado sobre .data para que groupByDay no se recompute en cada render (flattenUniquePages
  // devuelve un array nuevo cada vez y rompería la memoización de `days`).
  const movieItems = useMemo(
    () => flattenUniquePages<MediaSummary>(type !== 'series' ? movies.data : undefined, mediaKey),
    [type, movies.data],
  )
  const seriesItems = useMemo(
    () => flattenUniquePages<MediaSummary>(type !== 'movies' ? series.data : undefined, mediaKey),
    [type, series.data],
  )

  const days = useMemo(() => groupByDay([...movieItems, ...seriesItems], fromKey, toKey), [movieItems, seriesItems, fromKey, toKey])

  const activeQueries = [
    ...(type !== 'series' ? [movies] : []),
    ...(type !== 'movies' ? [series] : []),
  ]
  const isLoading = activeQueries.some((query) => query.isLoading)
  // Solo mostramos error si TODAS las fuentes activas fallaron (una parcial deja ver el resto).
  const isError = activeQueries.length > 0 && activeQueries.every((query) => query.isError)
  const hasNextPage = activeQueries.some((query) => query.hasNextPage)
  const isFetchingNextPage = activeQueries.some((query) => query.isFetchingNextPage)

  function shift(direction: 1 | -1) {
    setAnchor((current) => (view === 'week' ? addDays(current, 7 * direction) : shiftMonth(current, direction)))
  }

  function loadMore() {
    activeQueries.forEach((query) => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage()
      }
    })
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="max-w-2xl">
          <p className="kicker">Estrenos</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Calendario</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Qué se estrena y qué se viene, ordenado por fecha. Cine y series en un solo lugar.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl<CalendarView>
              ariaLabel="Vista del calendario"
              value={view}
              onChange={setView}
              options={[
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
              ]}
            />
            <SegmentedControl<CalendarType>
              ariaLabel="Tipo de contenido"
              value={type}
              onChange={setType}
              options={[
                { value: 'all', label: 'Todo' },
                { value: 'movies', label: 'Películas' },
                { value: 'series', label: 'Series' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <NavButton label="Período anterior" onClick={() => shift(-1)} direction="prev" />
            <span className="min-w-[11rem] text-center text-sm font-semibold text-[var(--color-text-primary)]">
              {view === 'week' ? rangeLabel(from, to) : monthLabel(anchor)}
            </span>
            <NavButton label="Período siguiente" onClick={() => shift(1)} direction="next" />
            <button type="button" onClick={() => setAnchor(new Date())} className="secondary-action min-h-9 px-3 py-2 text-xs">
              Hoy
            </button>
          </div>
        </div>

        <section className="mt-10">
          {isLoading ? <MediaGridSkeleton /> : null}
          {isError ? (
            <ErrorState
              action={
                <button type="button" onClick={() => activeQueries.forEach((query) => void query.refetch())} className="secondary-action">
                  Reintentar
                </button>
              }
            />
          ) : null}
          {!isLoading && !isError && days.length === 0 ? (
            <EmptyState title="Sin estrenos" message="No hay estrenos para este período. Probá con otra semana o mes." />
          ) : null}

          {!isLoading && !isError && days.length > 0 ? (
            <div className="grid gap-10">
              {days.map((day) => (
                <div key={day.key}>
                  <div className="mb-4 flex items-baseline gap-3 border-b border-white/10 pb-2">
                    <h2 className="text-lg font-semibold">{dayLabel(day.date)}</h2>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {day.items.length} {day.items.length === 1 ? 'estreno' : 'estrenos'}
                    </span>
                  </div>
                  <MediaGrid items={day.items} />
                </div>
              ))}
              <LoadMoreButton hasMore={hasNextPage} isLoading={isFetchingNextPage} onClick={loadMore} />
            </div>
          ) : null}
        </section>
      </main>
    </PublicLayout>
  )
}

type CalendarDay = { key: string; date: Date; items: MediaSummary[] }

function groupByDay(items: MediaSummary[], fromKey: string, toKey: string): CalendarDay[] {
  const buckets = new Map<string, MediaSummary[]>()

  for (const item of items) {
    const key = item.releaseDate?.slice(0, 10)
    if (!key || key < fromKey || key > toKey) {
      continue
    }
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      buckets.set(key, [item])
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayItems]) => ({ key, date: parseDateKey(key), items: dayItems }))
}

function resolveWindow(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  if (view === 'week') {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 6) }
  }
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
}

function shiftMonth(date: Date, direction: 1 | -1): Date {
  return new Date(date.getFullYear(), date.getMonth() + direction, 1)
}

function NavButton({ label, onClick, direction }: { label: string; onClick: () => void; direction: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] text-[var(--color-text-secondary)] transition hover:bg-white/[0.1] hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {direction === 'prev' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  )
}
