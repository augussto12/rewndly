import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { useKeywordDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

type KeywordTab = 'movies' | 'series'

export function KeywordDetailsPage() {
  const keywordId = Number(useParams().keywordId)
  const { data, isError, isLoading } = useKeywordDetails(keywordId)
  const tabs = useMemo(
    () =>
      data
        ? [
            { id: 'movies' as const, label: 'Películas', enabled: data.movies.length > 0 },
            { id: 'series' as const, label: 'Series', enabled: data.series.length > 0 },
          ].filter((tab) => tab.enabled)
        : [],
    [data],
  )
  const [activeTab, setActiveTab] = useState<KeywordTab>('movies')
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? 'movies'

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(keywordId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la palabra clave" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main className="page-shell">
          <section>
            <p className="kicker">Palabra clave</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/discover" className="secondary-action">
                Explorar catálogo
              </Link>
            </div>
          </section>

          <section className="surface-panel overflow-hidden">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <p className="kicker">Resultados</p>
              <div className="scrollbar-cinema mt-4 flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <FilterChip
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    active={selectedTab === tab.id}
                  >
                    {tab.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {tabs.length === 0 ? <EmptyState title="Sin resultados" message="TMDB no devolvió contenido para esta palabra clave." /> : null}
              {selectedTab === 'movies' ? <MediaGrid items={data.movies} /> : null}
              {selectedTab === 'series' ? <MediaGrid items={data.series} /> : null}
            </div>
          </section>
        </main>
      ) : null}
    </PublicLayout>
  )
}
