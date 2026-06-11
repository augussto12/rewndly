import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchMovies, searchPeople, searchSeries } from '../../../features/public-media/services/publicMediaApi'
import type { MediaSummary, PersonSummary } from '../../../features/public-media/types/publicMedia.types'

type SearchResult =
  | { id: string; label: string; detail: string; imageUrl: string | null; href: string; group: 'Películas' | 'Series' }
  | { id: string; label: string; detail: string; imageUrl: string | null; href: string; group: 'Personas' }

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 220)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  const canSearch = debouncedQuery.length >= 2
  const movies = useQuery({
    queryKey: ['global-search', 'movies', debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery, 1),
    enabled: isOpen && canSearch,
  })
  const series = useQuery({
    queryKey: ['global-search', 'series', debouncedQuery],
    queryFn: () => searchSeries(debouncedQuery, 1),
    enabled: isOpen && canSearch,
  })
  const people = useQuery({
    queryKey: ['global-search', 'people', debouncedQuery],
    queryFn: () => searchPeople(debouncedQuery, 1),
    enabled: isOpen && canSearch,
  })

  const results = useMemo(
    () => [
      ...toMediaResults(movies.data?.items ?? [], 'Películas'),
      ...toMediaResults(series.data?.items ?? [], 'Series'),
      ...toPersonResults(people.data?.items ?? []),
    ],
    [movies.data?.items, people.data?.items, series.data?.items],
  )

  const isLoading = canSearch && (movies.isLoading || series.isLoading || people.isLoading)
  const hasError = movies.isError || series.isError || people.isError

  function closeSearch() {
    setIsOpen(false)
    onNavigate?.()
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (results[0]) {
      navigate(results[0].href)
      closeSearch()
      return
    }

    if (query.trim().length >= 2) {
      navigate(`/movies/search?q=${encodeURIComponent(query.trim())}`)
      closeSearch()
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1]"
        aria-label="Buscar"
        aria-expanded={isOpen}
        title="Buscar"
      >
        <span className="relative h-4 w-4" aria-hidden="true">
          <span className="absolute left-0 top-0 h-3 w-3 rounded-full border-2 border-current" />
          <span className="absolute bottom-0 right-0 h-2 w-0.5 rotate-[-45deg] rounded-full bg-current" />
        </span>
      </button>

      {isOpen ? (
        <div className="global-search-popover">
          <form onSubmit={submitSearch} className="border-b border-white/10 p-3">
            <label className="sr-only" htmlFor="global-search-input">
              Buscar películas, series o personas
            </label>
            <input
              ref={inputRef}
              id="global-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar películas, series o personas"
              className="field min-h-11"
            />
          </form>

          {canSearch ? (
            <div className="global-search-results scrollbar-cinema overflow-y-auto p-2">
              {isLoading ? <p className="px-3 py-4 text-sm text-[var(--color-text-secondary)]">Buscando...</p> : null}
              {hasError ? <p className="px-3 py-4 text-sm text-red-200">No pudimos completar la búsqueda.</p> : null}
              {!isLoading && !hasError && results.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--color-text-secondary)]">Sin resultados.</p>
              ) : null}

              {!isLoading && !hasError ? (
                <div className="grid gap-1">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      to={result.href}
                      onClick={closeSearch}
                      className="flex min-w-0 gap-3 rounded-[var(--radius-sm)] p-2 transition hover:bg-white/[0.07]"
                    >
                      <div className="grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white/[0.06]">
                        {result.imageUrl ? <img src={result.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold text-white">{result.label}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                          {result.group} {result.detail ? `- ${result.detail}` : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function toMediaResults(items: MediaSummary[], group: 'Películas' | 'Series'): SearchResult[] {
  return items.slice(0, 4).map((item) => ({
    id: `${item.mediaType}-${item.tmdbId}`,
    label: item.title,
    detail: [item.releaseDate?.slice(0, 4), item.voteAverage ? `${item.voteAverage}/10` : ''].filter(Boolean).join(' - '),
    imageUrl: item.posterUrl,
    href: item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`,
    group,
  }))
}

function toPersonResults(items: PersonSummary[]): SearchResult[] {
  return items.slice(0, 4).map((item) => ({
    id: `Person-${item.tmdbId}`,
    label: item.name,
    detail: item.knownForDepartment ?? '',
    imageUrl: item.profileUrl,
    href: `/people/${item.tmdbId}`,
    group: 'Personas',
  }))
}
