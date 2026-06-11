import { useState, useMemo, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { FilterChip } from '../components/filters/FilterChip'
import { getAdminActivityEventsPage } from '../features/admin/services/adminApi'
import type { AdminActivityEvent, AdminPagedResponse } from '../features/admin/types/admin.types'
import { PublicLayout } from '../layouts/PublicLayout'

// ─── Icons ────────────────────────────────────────────────────────────────────

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IBookmark() { return <Svg><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg> }
function IEye() { return <Svg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg> }
function IStar() { return <Svg><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg> }
function IMessage() { return <Svg><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> }
function IListPlus() { return <Svg><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Svg> }
function IListAdd() { return <Svg><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Svg> }
function IHeart() { return <Svg><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></Svg> }
function IUsers() { return <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg> }
function ISearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.46" />
    </svg>
  )
}

// ─── Event type catalogue ─────────────────────────────────────────────────────

type EventMeta = {
  label: string
  shortLabel: string
  color: string
  textClass: string
  bgStyle: string
  Icon: ComponentType
  describe: (e: AdminActivityEvent) => string
}

const EVENT_META: Record<string, EventMeta> = {
  AddedToWatchlist: {
    label: 'Watchlist', shortLabel: 'Watchlist',
    color: '#2dd4bf', textClass: 'text-teal-300', bgStyle: 'rgba(45,212,191,0.12)',
    Icon: IBookmark,
    describe: (e) => `agregó "${e.mediaTitle ?? 'contenido'}" a su watchlist`,
  },
  MarkedAsWatched: {
    label: 'Vista', shortLabel: 'Vista',
    color: '#34d399', textClass: 'text-emerald-300', bgStyle: 'rgba(52,211,153,0.12)',
    Icon: IEye,
    describe: (e) => `marcó "${e.mediaTitle ?? 'contenido'}" como vista`,
  },
  Rated: {
    label: 'Puntuación', shortLabel: 'Punt.',
    color: '#fbbf24', textClass: 'text-amber-300', bgStyle: 'rgba(251,191,36,0.12)',
    Icon: IStar,
    describe: (e) => `puntuó "${e.mediaTitle ?? 'contenido'}"`,
  },
  Reviewed: {
    label: 'Reseña', shortLabel: 'Reseña',
    color: '#a78bfa', textClass: 'text-violet-300', bgStyle: 'rgba(167,139,250,0.12)',
    Icon: IMessage,
    describe: (e) => `reseñó "${e.mediaTitle ?? 'contenido'}"`,
  },
  CreatedList: {
    label: 'Lista nueva', shortLabel: 'Lista',
    color: '#60a5fa', textClass: 'text-blue-300', bgStyle: 'rgba(96,165,250,0.12)',
    Icon: IListPlus,
    describe: () => 'creó una lista nueva',
  },
  AddedToList: {
    label: 'En lista', shortLabel: 'En lista',
    color: '#818cf8', textClass: 'text-indigo-300', bgStyle: 'rgba(129,140,248,0.12)',
    Icon: IListAdd,
    describe: (e) => `agregó "${e.mediaTitle ?? 'contenido'}" a una lista`,
  },
  Favorited: {
    label: 'Favorita', shortLabel: 'Fav.',
    color: '#fb7185', textClass: 'text-rose-300', bgStyle: 'rgba(251,113,133,0.12)',
    Icon: IHeart,
    describe: (e) => `marcó "${e.mediaTitle ?? 'contenido'}" como favorita`,
  },
  FriendRequestAccepted: {
    label: 'Sol. aceptada', shortLabel: 'Solicitud',
    color: '#67e8f9', textClass: 'text-cyan-300', bgStyle: 'rgba(103,232,249,0.12)',
    Icon: IUsers,
    describe: () => 'aceptó una solicitud de amistad',
  },
  FriendAdded: {
    label: 'Amigo nuevo', shortLabel: 'Amistad',
    color: '#22d3ee', textClass: 'text-sky-300', bgStyle: 'rgba(34,211,238,0.12)',
    Icon: IUsers,
    describe: () => 'sumó una amistad',
  },
}

const KNOWN_TYPES = Object.keys(EVENT_META)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ayer'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

function dayKey(iso: string) {
  return new Date(iso).toDateString()
}

function dayLabel(key: string): string {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (key === today) return 'Hoy'
  if (key === yesterday) return 'Ayer'
  const d = new Date(key)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function flatten(data: { pages: AdminPagedResponse<AdminActivityEvent>[] } | undefined): AdminActivityEvent[] {
  const seen = new Set<string>()
  const out: AdminActivityEvent[] = []
  data?.pages.forEach((p) => p.items.forEach((item) => {
    if (!seen.has(item.id)) { seen.add(item.id); out.push(item) }
  }))
  return out
}

// ─── Infinite query ───────────────────────────────────────────────────────────

function useActivityFeed() {
  return useInfiniteQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: ({ pageParam }: { pageParam: number }) => getAdminActivityEventsPage(pageParam, 100),
    initialPageParam: 1,
    getNextPageParam: (last: AdminPagedResponse<AdminActivityEvent>) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  })
}

// ─── Page component ───────────────────────────────────────────────────────────

export function FeedPage() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)

  const query = useActivityFeed()
  const allItems = flatten(query.data)

  // Client-side filter
  const filtered = useMemo(() => {
    let items = allItems
    if (activeType) items = items.filter((e) => e.eventType === activeType)
    const q = search.trim().toLowerCase()
    if (q) {
      items = items.filter(
        (e) =>
          e.username.toLowerCase().includes(q) ||
          (e.mediaTitle ?? '').toLowerCase().includes(q),
      )
    }
    return items
  }, [allItems, activeType, search])

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, AdminActivityEvent[]>()
    filtered.forEach((e) => {
      const k = dayKey(e.createdAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(e)
    })
    return Array.from(map.entries()).map(([k, items]) => ({ label: dayLabel(k), items }))
  }, [filtered])

  // Stats from today's data (across all loaded pages)
  const stats = useMemo(() => {
    const todayKey = new Date().toDateString()
    const today = allItems.filter((e) => dayKey(e.createdAt) === todayKey)
    const users = new Set(today.map((e) => e.username)).size
    const freq: Record<string, number> = {}
    today.forEach((e) => { freq[e.eventType] = (freq[e.eventType] ?? 0) + 1 })
    const top = Object.entries(freq).sort(([, a], [, b]) => b - a)[0]
    return {
      todayCount: today.length,
      uniqueUsers: users,
      topLabel: top ? (EVENT_META[top[0]]?.label ?? top[0]) : '—',
      total: allItems.length,
    }
  }, [allItems])

  const isFirstLoad = query.isLoading && allItems.length === 0
  const isEmpty = !query.isLoading && !query.isError && filtered.length === 0
  const totalEvents = query.data?.pages[0]?.total ?? allItems.length

  return (
    <PublicLayout>
      <main className="page-shell">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Admin · Solo vos</p>
            <h1 className="mt-2 text-3xl font-semibold">Actividad del sitio</h1>
            {allItems.length > 0 && (
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                {allItems.length} eventos cargados
                {query.hasNextPage ? ` · hay más disponibles` : ' · todo cargado'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="secondary-action flex shrink-0 items-center gap-2"
          >
            <IRefresh />
            {query.isFetching ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        {/* ── Stats bar ── */}
        {allItems.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Hoy" value={stats.todayCount} color="#a78bfa" />
            <StatCard label="Usuarios hoy" value={stats.uniqueUsers} color="#60a5fa" />
            <StatCard label="Más frecuente" value={stats.topLabel} color="#fbbf24" />
            <StatCard label="Total cargado" value={stats.total} color="#2dd4bf" />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="surface-panel sticky top-[4.25rem] z-10 mb-7 space-y-3 p-3 sm:p-4">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              <ISearch />
            </span>
            <input
              type="search"
              placeholder="Buscar por usuario o título…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-full pl-9"
            />
          </div>

          {/* Type chips — horizontally scrollable */}
          <div className="scrollbar-cinema -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <Chip
              label="Todos"
              isSelected={activeType === null}
              onClick={() => setActiveType(null)}
              dot={null}
            />
            {KNOWN_TYPES.map((type) => (
              <Chip
                key={type}
                label={EVENT_META[type].label}
                isSelected={activeType === type}
                onClick={() => setActiveType((t) => (t === type ? null : type))}
                dot={EVENT_META[type].color}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-[var(--color-text-secondary)]">
            <span>{filtered.length} de {allItems.length} eventos visibles</span>
            {(activeType || search) ? (
              <button type="button" onClick={() => { setActiveType(null); setSearch('') }} className="font-semibold text-violet-200 hover:text-white">
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Content ── */}
        {query.isError && <ErrorState />}

        {isFirstLoad && <FeedSkeleton />}

        {isEmpty && (
          <div className="surface-panel py-16 text-center text-[var(--color-text-secondary)]">
            No hay eventos que coincidan con esos filtros.
          </div>
        )}

        {!isFirstLoad && !query.isError && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map((g) => (
              <DayGroup key={g.label} label={g.label} items={g.items} />
            ))}
          </div>
        )}

        {/* ── Load more ── */}
        {query.hasNextPage && !activeType && !search && (
          <div className="mt-10 text-center">
            <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
              Mostrando {allItems.length} de {totalEvents} eventos
            </p>
            <button
              type="button"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="secondary-action"
            >
              {query.isFetchingNextPage ? 'Cargando…' : 'Cargar más eventos'}
            </button>
          </div>
        )}
      </main>
    </PublicLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="surface-panel-muted relative overflow-hidden rounded-[var(--radius-md)] p-4">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
      />
      <p className="truncate text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}

function Chip({
  label, isSelected, onClick, dot,
}: {
  label: string; isSelected: boolean; onClick: () => void; dot: string | null
}) {
  return (
    <FilterChip
      active={isSelected}
      size="sm"
      dot={dot}
      onClick={onClick}
    >
      {label}
    </FilterChip>
  )
}

function DayGroup({ label, items }: { label: string; items: AdminActivityEvent[] }) {
  return (
    <section>
      {/* Day divider */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.07]" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
          {label}
        </span>
        <span className="text-[0.65rem] text-[var(--color-text-secondary)] opacity-50">
          {items.length} evento{items.length !== 1 ? 's' : ''}
        </span>
        <div className="h-px flex-1 bg-white/[0.07]" />
      </div>

      {/* Rows */}
      <div className="space-y-px">
        {items.map((item) => (
          <EventRow key={item.id} event={item} />
        ))}
      </div>
    </section>
  )
}

function EventRow({ event }: { event: AdminActivityEvent }) {
  const meta = EVENT_META[event.eventType]
  const initial = event.username.charAt(0).toUpperCase()
  const mediaHref =
    event.tmdbId
      ? event.mediaType === 'Movie'
        ? `/movies/${event.tmdbId}`
        : event.mediaType === 'Series'
          ? `/series/${event.tmdbId}`
          : null
      : null

  return (
    <div className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition hover:bg-white/[0.038]">
      {/* Color dot */}
      <span
        className="hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block"
        style={{ backgroundColor: meta?.color ?? '#52525b' }}
      />

      {/* Avatar */}
      <span
        className="inline-grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold"
        style={{ background: 'rgba(124,58,237,0.25)', color: '#e9d5ff', userSelect: 'none' }}
      >
        {initial}
      </span>

      {/* Description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <Link
            to={`/users/${event.username}`}
            className="font-semibold text-white transition hover:text-violet-200"
          >
            {event.username}
          </Link>
          {' '}
          <span className="text-[var(--color-text-secondary)]">
            {meta ? (
              <>
                {/* Action verb */}
                {event.eventType === 'AddedToWatchlist' && 'agregó '}
                {event.eventType === 'MarkedAsWatched' && 'marcó '}
                {event.eventType === 'Rated' && 'puntuó '}
                {event.eventType === 'Reviewed' && 'reseñó '}
                {event.eventType === 'CreatedList' && 'creó una lista nueva'}
                {event.eventType === 'AddedToList' && 'agregó '}
                {event.eventType === 'Favorited' && 'marcó '}
                {event.eventType === 'FriendRequestAccepted' && 'aceptó una solicitud de amistad'}
                {event.eventType === 'FriendAdded' && 'sumó una amistad'}

                {/* Media title */}
                {event.mediaTitle && mediaHref && (
                  <Link to={mediaHref} className="font-medium text-[var(--color-text-primary)] hover:text-violet-200 transition">
                    {event.mediaTitle}
                  </Link>
                )}
                {event.mediaTitle && !mediaHref && (
                  <span className="font-medium text-[var(--color-text-primary)]">{event.mediaTitle}</span>
                )}

                {/* Trailing text */}
                {event.eventType === 'MarkedAsWatched' && ' como vista'}
                {event.eventType === 'Favorited' && ' como favorita'}
                {event.eventType === 'AddedToList' && ' a una lista'}
              </>
            ) : (
              event.eventType
            )}
          </span>
        </p>
      </div>

      {/* Badge — hidden on xs */}
      {meta && (
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide sm:flex ${meta.textClass}`}
          style={{ background: meta.bgStyle }}
        >
          <meta.Icon />
          <span>{meta.label}</span>
        </span>
      )}

      {/* Timestamp */}
      <span
        className="shrink-0 text-xs text-[var(--color-text-secondary)]"
        style={{ opacity: 0.55 }}
        title={new Date(event.createdAt).toLocaleString('es-AR')}
      >
        {timeAgo(event.createdAt)}
      </span>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="surface-panel space-y-2 p-3 animate-pulse sm:p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3">
          <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
          <div className="h-7 w-7 rounded-full bg-white/10" />
          <div className="h-4 flex-1 rounded bg-white/10" style={{ maxWidth: `${40 + (i % 5) * 10}%` }} />
          <div className="h-5 w-20 rounded-full bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}
