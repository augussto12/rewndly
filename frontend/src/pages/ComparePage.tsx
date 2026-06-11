import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { PublicLayout } from '../layouts/PublicLayout'
import { getMovieDetails, getSeriesDetails, searchMovies, searchSeries } from '../features/public-media/services/publicMediaApi'
import type { ExternalRating, MediaPerson, MediaSummary, MovieDetails, SeriesDetails, WatchProvider } from '../features/public-media/types/publicMedia.types'
import { formatExternalRating, ratingBySource } from '../features/public-media/utils/externalRatings'
import { translateSeriesStatus } from '../features/public-media/utils/tmdbLabels'

type CompareSelection = {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
}

type CompareDetails = MovieDetails | SeriesDetails

const maxSelections = 3

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const selections = useMemo(() => parseSelections(searchParams.get('items')), [searchParams])
  const canSearch = debouncedQuery.length >= 2

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 220)
    return () => window.clearTimeout(timeout)
  }, [query])

  const movies = useQuery({
    queryKey: ['compare-search', 'movies', debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery, 1),
    enabled: canSearch,
  })
  const series = useQuery({
    queryKey: ['compare-search', 'series', debouncedQuery],
    queryFn: () => searchSeries(debouncedQuery, 1),
    enabled: canSearch,
  })
  const detailQueries = useQueries({
    queries: selections.map((selection) => ({
      queryKey: ['compare-details', selection.mediaType, selection.tmdbId],
      queryFn: () => (selection.mediaType === 'Movie' ? getMovieDetails(selection.tmdbId) : getSeriesDetails(selection.tmdbId)),
      staleTime: 1000 * 60 * 30,
    })),
  })

  const searchResults = useMemo(() => mergeSearchResults(movies.data?.items ?? [], series.data?.items ?? []), [movies.data?.items, series.data?.items])
  const isSearching = canSearch && (movies.isLoading || series.isLoading)
  const hasSearchError = movies.isError || series.isError
  const compareItems = detailQueries
    .map((detail, index) => ({
      selection: selections[index],
      detail: detail.data as CompareDetails | undefined,
      isLoading: detail.isLoading,
      isError: detail.isError,
    }))
    .filter((item) => item.selection)

  function updateSelections(next: CompareSelection[]) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)

      if (next.length > 0) {
        params.set('items', next.map(toSelectionKey).join(','))
      } else {
        params.delete('items')
      }

      return params
    })
  }

  function addSelection(item: MediaSummary) {
    const next = distinctSelections([...selections, { mediaType: item.mediaType, tmdbId: item.tmdbId }]).slice(0, maxSelections)
    updateSelections(next)
  }

  function removeSelection(selection: CompareSelection) {
    updateSelections(selections.filter((item) => toSelectionKey(item) !== toSelectionKey(selection)))
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }

    window.setTimeout(() => setCopyStatus('idle'), 1600)
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Comparador</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Decidir qué ver sin vueltas</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Elegí 2 o 3 títulos y compará ratings, plataformas, duración, géneros, año y reparto principal.
          </p>
        </header>

        <section className="surface-panel mt-8 overflow-hidden">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div>
              <label htmlFor="compare-search" className="text-sm font-semibold text-white">
                Buscar título
              </label>
              <div className="mt-2">
                <input
                  id="compare-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar película o serie"
                  className="field min-h-12"
                />
              </div>
              {canSearch || isSearching || hasSearchError ? (
                <div className="mt-4">
                  {isSearching ? <p className="rounded-[var(--radius-sm)] bg-white/[0.04] px-3 py-4 text-sm text-[var(--color-text-secondary)]">Buscando...</p> : null}
                  {hasSearchError ? <p className="rounded-[var(--radius-sm)] bg-red-500/10 px-3 py-4 text-sm text-red-100">No pudimos completar la búsqueda.</p> : null}
                  {canSearch && !isSearching && !hasSearchError && searchResults.length === 0 ? (
                    <p className="rounded-[var(--radius-sm)] bg-white/[0.04] px-3 py-4 text-sm text-[var(--color-text-secondary)]">Sin resultados.</p>
                  ) : null}
                  {!isSearching && !hasSearchError && searchResults.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {searchResults.map((item) => {
                        const isSelected = selections.some((selection) => selection.mediaType === item.mediaType && selection.tmdbId === item.tmdbId)
                        const isFull = selections.length >= maxSelections && !isSelected

                        return (
                          <button
                            key={`${item.mediaType}-${item.tmdbId}`}
                            type="button"
                            onClick={() => addSelection(item)}
                            disabled={isSelected || isFull}
                            className="group flex min-h-20 min-w-0 items-center gap-3 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] p-2 text-left transition hover:border-violet-200/35 hover:bg-white/[0.075] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <PosterThumb src={item.posterUrl} title={item.title} />
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-1 text-sm font-semibold text-white">{item.title}</span>
                              <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                                {item.mediaType === 'Movie' ? 'Película' : 'Serie'} {item.releaseDate ? `- ${item.releaseDate.slice(0, 4)}` : ''}
                              </span>
                            </span>
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-black/25 text-white">
                              {isSelected
                                ? <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                : <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                              }
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="rounded-[var(--radius-md)] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="kicker">Selección</p>
                  <h2 className="mt-1 text-lg font-semibold">{selections.length}/{maxSelections}</h2>
                </div>
                {selections.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void copyShareLink()}
                      className={`secondary-action min-h-9 gap-2 px-3 py-2 text-xs ${copyStatus === 'copied' ? 'border-emerald-200/35 text-emerald-100' : copyStatus === 'failed' ? 'border-red-200/35 text-red-100' : ''}`}
                    >
                      <CopyIcon />
                      {copyStatus === 'copied' ? 'Copiado' : copyStatus === 'failed' ? 'Error' : 'Copiar link'}
                    </button>
                    <button type="button" onClick={() => updateSelections([])} className="secondary-action min-h-9 px-3 py-2 text-xs">
                      Limpiar
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2">
                {compareItems.map((item) => (
                  <SelectedItem
                    key={toSelectionKey(item.selection)}
                    selection={item.selection}
                    detail={item.detail}
                    isLoading={item.isLoading}
                    onRemove={() => removeSelection(item.selection)}
                  />
                ))}
                {Array.from({ length: maxSelections - selections.length }).map((_, index) => (
                  <div key={index} className="grid min-h-16 place-items-center rounded-[var(--radius-sm)] border border-dashed border-white/10 bg-white/[0.025] px-3 text-sm text-[var(--color-text-secondary)]">
                    Slot libre
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="kicker">Mesa chica</p>
            <h2 className="mt-2 text-2xl font-semibold">Comparativa</h2>
          </div>

          {selections.length < 2 ? (
            <div className="surface-panel grid min-h-44 place-items-center p-6 text-center">
              <div>
                <p className="text-lg font-semibold text-white">Sumá al menos 2 títulos</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Cuando estén elegidos aparece la tabla completa.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {compareItems.map((item) => (
                  <CompareHeroCard key={toSelectionKey(item.selection)} item={item} onRemove={() => removeSelection(item.selection)} />
                ))}
              </div>

              <div className="surface-panel overflow-hidden">
                <CompareRow label="IMDb" items={compareItems} render={(detail) => <RatingCell rating={ratingBySource(detail.externalRatings, 'IMDb')} fallback="Sin dato" />} />
                <CompareRow label="Crítica" items={compareItems} render={(detail) => <CriticCell ratings={detail.externalRatings} />} />
                <CompareRow label="Duración" items={compareItems} render={(detail) => <TextCell value={formatDuration(detail)} />} />
                <CompareRow label="Plataformas" items={compareItems} render={(detail) => <ProviderCell providers={detail.watchProviders} />} />
                <CompareRow label="Géneros" items={compareItems} render={(detail) => <TagCell values={detail.genres.slice(0, 5)} />} />
                <CompareRow label="Año" items={compareItems} render={(detail) => <TextCell value={getYear(detail)} />} />
                <CompareRow label="Reparto" items={compareItems} render={(detail) => <CastCell cast={detail.cast} />} />
              </div>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  )
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function SelectedItem({
  selection,
  detail,
  isLoading,
  onRemove,
}: {
  selection: CompareSelection
  detail: CompareDetails | undefined
  isLoading: boolean
  onRemove: () => void
}) {
  const title = detail ? getTitle(detail) : selection.mediaType === 'Movie' ? 'Película' : 'Serie'

  return (
    <div className="flex min-h-16 min-w-0 items-center gap-3 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] p-2">
      <PosterThumb src={detail?.posterUrl ?? null} title={title} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-white">{isLoading ? 'Cargando...' : title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{selection.mediaType === 'Movie' ? 'Película' : 'Serie'}</p>
      </div>
      <button type="button" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition hover:bg-white/[0.08] hover:text-white" aria-label={`Quitar ${title}`}>
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  )
}

function CompareHeroCard({
  item,
  onRemove,
}: {
  item: { selection: CompareSelection; detail: CompareDetails | undefined; isLoading: boolean; isError: boolean }
  onRemove: () => void
}) {
  const detail = item.detail
  const href = item.selection.mediaType === 'Movie' ? `/movies/${item.selection.tmdbId}` : `/series/${item.selection.tmdbId}`

  if (item.isLoading) {
    return <div className="min-h-72 animate-pulse rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04]" />
  }

  if (item.isError || !detail) {
    return (
      <div className="grid min-h-72 place-items-center rounded-[var(--radius-md)] border border-red-400/20 bg-red-500/10 p-4 text-center text-sm text-red-100">
        No pudimos cargar este título.
      </div>
    )
  }

  const imdb = ratingBySource(detail.externalRatings, 'IMDb')
  const critic = pickCriticRating(detail.externalRatings)

  return (
    <article className="relative overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-white/[0.045]">
      {detail.backdropUrl ? <img src={detail.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080a13] via-[#080a13]/85 to-[#080a13]/55" />
      <div className="relative flex min-h-72 flex-col justify-end p-4">
        <button type="button" onClick={onRemove} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-black/35 text-white transition hover:bg-black/55" aria-label={`Quitar ${getTitle(detail)}`}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div className="flex gap-4">
          <PosterThumb src={detail.posterUrl} title={getTitle(detail)} large />
          <div className="min-w-0 self-end">
            <p className="kicker">{item.selection.mediaType === 'Movie' ? 'Película' : 'Serie'}</p>
            <Link to={href} className="mt-2 block line-clamp-2 text-xl font-semibold leading-tight text-white hover:text-violet-100">
              {getTitle(detail)}
            </Link>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{[getYear(detail), formatDuration(detail)].filter(Boolean).join(' / ')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ScorePill label="IMDb" value={formatExternalRating(imdb) ?? '-'} />
              <ScorePill label={critic?.label ?? 'Crítica'} value={formatExternalRating(critic) ?? '-'} tone="critic" />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function CompareRow({
  label,
  items,
  render,
}: {
  label: string
  items: Array<{ detail: CompareDetails | undefined; isLoading: boolean; isError: boolean }>
  render: (detail: CompareDetails) => ReactNode
}) {
  return (
    <div className="grid border-b border-white/10 last:border-b-0 lg:grid-cols-[11rem_1fr]">
      <div className="hidden bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white lg:block lg:border-r lg:border-white/10">{label}</div>
      <div className="grid gap-0 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {items.map((item, index) => (
          <div key={index} className="min-h-16 border-t border-white/10 px-4 py-3 lg:border-l lg:border-t-0 lg:first:border-l-0">
            <span className="mb-2 block text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)] lg:hidden">{label}</span>
            {item.isLoading ? <span className="text-sm text-[var(--color-text-secondary)]">Cargando...</span> : null}
            {item.isError ? <span className="text-sm text-red-100">Sin datos</span> : null}
            {!item.isLoading && !item.isError && item.detail ? render(item.detail) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function PosterThumb({ src, title, large = false }: { src: string | null; title: string; large?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white/[0.06] ${large ? 'h-32 w-24' : 'h-14 w-10'}`}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="px-1 text-center text-[10px] text-[var(--color-text-secondary)]">Sin póster</span>}
      <span className="sr-only">{title}</span>
    </span>
  )
}

function ScorePill({ label, value, tone = 'imdb' }: { label: string; value: string; tone?: 'imdb' | 'critic' }) {
  const toneClass = tone === 'critic' ? 'border-cyan-200/20 bg-cyan-400/10 text-cyan-100' : 'border-amber-200/25 bg-amber-300/10 text-amber-100'

  return (
    <span className={`rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {label} {value}
    </span>
  )
}

function RatingCell({ rating, fallback }: { rating: ExternalRating | null; fallback: string }) {
  const value = formatExternalRating(rating)

  return <TextCell value={value ? `${rating?.label ?? 'Rating'} ${value}` : fallback} strong={Boolean(value)} />
}

function CriticCell({ ratings }: { ratings: ExternalRating[] }) {
  const critic = pickCriticRating(ratings)
  const value = formatExternalRating(critic)

  return <TextCell value={value ? `${critic?.label ?? 'Crítica'} ${value}` : 'Sin dato'} strong={Boolean(value)} />
}

function TextCell({ value, strong = false }: { value: string | null; strong?: boolean }) {
  return <span className={`text-sm ${strong ? 'font-semibold text-white' : 'text-[var(--color-text-secondary)]'}`}>{value || 'Sin dato'}</span>
}

function TagCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <TextCell value="Sin dato" />
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-2 py-1 text-xs font-semibold text-white">
          {value}
        </span>
      ))}
    </div>
  )
}

function ProviderCell({ providers }: { providers: WatchProvider[] }) {
  const streaming = uniqueProviders(providers.filter((provider) => provider.type === 'Streaming')).slice(0, 5)
  const fallback = streaming.length > 0 ? streaming : uniqueProviders(providers).slice(0, 5)

  if (fallback.length === 0) {
    return <TextCell value="Sin dato" />
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fallback.map((provider) => (
        <span key={`${provider.type}-${provider.providerId}`} className="flex min-h-8 max-w-full items-center gap-2 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-xs font-semibold text-white sm:px-3">
          {provider.logoUrl ? <img src={provider.logoUrl} alt="" className="h-5 w-5 shrink-0 rounded object-cover" loading="lazy" /> : null}
          <span className="min-w-0 truncate">{provider.name}</span>
        </span>
      ))}
    </div>
  )
}

function CastCell({ cast }: { cast: MediaPerson[] }) {
  const names = cast.slice(0, 5).map((person) => person.name)
  return <TagCell values={names} />
}

function mergeSearchResults(movies: MediaSummary[], series: MediaSummary[]) {
  return distinctMedia([...movies.slice(0, 5), ...series.slice(0, 5)]).slice(0, 8)
}

function distinctMedia(items: MediaSummary[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.mediaType}-${item.tmdbId}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function parseSelections(value: string | null): CompareSelection[] {
  if (!value) {
    return []
  }

  return distinctSelections(
    value
      .split(',')
      .map((item) => {
        const [mediaType, id] = item.split('-')
        const tmdbId = Number(id)

        if ((mediaType === 'Movie' || mediaType === 'Series') && Number.isFinite(tmdbId)) {
          return { mediaType, tmdbId }
        }

        return null
      })
      .filter((item): item is CompareSelection => item !== null),
  ).slice(0, maxSelections)
}

function distinctSelections(items: CompareSelection[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = toSelectionKey(item)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function toSelectionKey(selection: CompareSelection) {
  return `${selection.mediaType}-${selection.tmdbId}`
}

function getTitle(detail: CompareDetails) {
  return detail.mediaType === 'Movie' ? detail.title : detail.name
}

function getYear(detail: CompareDetails) {
  const date = detail.mediaType === 'Movie' ? detail.releaseDate : detail.firstAirDate
  return date?.slice(0, 4) ?? null
}

function formatDuration(detail: CompareDetails) {
  if (detail.mediaType === 'Movie') {
    return formatRuntime(detail.runtimeMinutes)
  }

  const seasons = detail.numberOfSeasons ? `${detail.numberOfSeasons} temp.` : null
  const episodes = detail.numberOfEpisodes ? `${detail.numberOfEpisodes} eps.` : null
  return [seasons, episodes].filter(Boolean).join(' / ') || translateSeriesStatus(detail.status) || null
}

function formatRuntime(minutes: number | null) {
  if (!minutes) {
    return null
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) {
    return `${rest} min`
  }

  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

function pickCriticRating(ratings: ExternalRating[]) {
  return ratingBySource(ratings, 'Metacritic') ?? ratingBySource(ratings, 'RottenTomatoes')
}

function uniqueProviders(providers: WatchProvider[]) {
  const seen = new Set<number>()
  return providers.filter((provider) => {
    if (seen.has(provider.providerId)) {
      return false
    }

    seen.add(provider.providerId)
    return true
  })
}
