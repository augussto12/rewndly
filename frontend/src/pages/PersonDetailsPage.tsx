import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { usePersonDetails } from '../features/public-media/hooks/usePublicMedia'
import type { MediaExternalLink, MediaSummary, MediaTranslation, PersonImage, PersonTaggedImage } from '../features/public-media/types/publicMedia.types'
import { PublicLayout } from '../layouts/PublicLayout'
import { safeExternalUrl } from '../lib/safeExternalUrl'

type PersonTab = 'featured' | 'movies' | 'series' | 'images' | 'tagged' | 'data'

export function PersonDetailsPage() {
  const tmdbId = Number(useParams().tmdbId)
  const { data, isError, isLoading } = usePersonDetails(tmdbId)
  const tabs = useMemo(
    () =>
      data
        ? [
            { id: 'featured' as const, label: 'Destacados', enabled: data.combinedCredits.length > 0 },
            { id: 'movies' as const, label: 'Peliculas', enabled: data.movieCredits.length > 0 },
            { id: 'series' as const, label: 'Series', enabled: data.tvCredits.length > 0 },
            { id: 'images' as const, label: 'Fotos', enabled: data.images.length > 0 },
            { id: 'tagged' as const, label: 'Tagged', enabled: data.taggedImages.length > 0 },
            { id: 'data' as const, label: 'Datos', enabled: data.externalLinks.length > 0 || data.translations.length > 0 },
          ].filter((tab) => tab.enabled)
        : [],
    [data],
  )
  const [activeTab, setActiveTab] = useState<PersonTab>('featured')

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(tmdbId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la persona" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[16rem_1fr] md:py-16">
            <div className="w-44 md:w-full">
              <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/[0.12] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)]">
                {data.profileUrl ? (
                  <img src={data.profileUrl} alt={data.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-[var(--color-text-secondary)]">Sin foto</div>
                )}
              </div>
            </div>

            <div className="min-w-0 self-end">
              <p className="kicker">{data.knownForDepartment || 'Persona'}</p>
              <h1 className="text-resilient mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
              <p className="text-resilient mt-3 text-sm text-[var(--color-text-secondary)]">
                {[formatDate(data.birthday), data.placeOfBirth].filter(Boolean).join(' / ')}
              </p>
              {data.biography ? (
                <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{data.biography}</p>
              ) : (
                <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                  Todavia no hay biografia disponible.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/people/search" className="secondary-action">
                  Volver a personas
                </Link>
                {safeExternalUrl(data.homepage) ? (
                  <a href={safeExternalUrl(data.homepage) ?? undefined} target="_blank" rel="noreferrer" className="secondary-action">
                    Sitio oficial
                  </a>
                ) : null}
                {data.imdbId ? (
                  <a href={`https://www.imdb.com/name/${data.imdbId}/`} target="_blank" rel="noreferrer" className="secondary-action">
                    IMDb
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          <PersonDeepDive
            tabs={tabs}
            activeTab={tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? 'featured'}
            onTabChange={setActiveTab}
            combinedCredits={data.combinedCredits}
            movieCredits={data.movieCredits}
            tvCredits={data.tvCredits}
            images={data.images}
            taggedImages={data.taggedImages}
            externalLinks={data.externalLinks}
            translations={data.translations}
          />
        </main>
      ) : null}
    </PublicLayout>
  )
}

function PersonDeepDive({
  tabs,
  activeTab,
  onTabChange,
  combinedCredits,
  movieCredits,
  tvCredits,
  images,
  taggedImages,
  externalLinks,
  translations,
}: {
  tabs: Array<{ id: PersonTab; label: string; enabled: boolean }>
  activeTab: PersonTab
  onTabChange: (tab: PersonTab) => void
  combinedCredits: MediaSummary[]
  movieCredits: MediaSummary[]
  tvCredits: MediaSummary[]
  images: PersonImage[]
  taggedImages: PersonTaggedImage[]
  externalLinks: MediaExternalLink[]
  translations: MediaTranslation[]
}) {
  if (tabs.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <EmptyState title="Sin datos para mostrar" message="Cuando TMDB devuelva creditos o imagenes, apareceran aca." />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <p className="kicker">Perfil profundo</p>
          <div className="scrollbar-cinema mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-white/[0.045] text-[var(--color-text-secondary)] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'featured' ? <CreditsGrid title="Peliculas y series destacadas" items={combinedCredits} /> : null}
          {activeTab === 'movies' ? <CreditsGrid title="Creditos de peliculas" items={movieCredits} /> : null}
          {activeTab === 'series' ? <CreditsGrid title="Creditos de series" items={tvCredits} /> : null}
          {activeTab === 'images' ? <PersonImages images={images} /> : null}
          {activeTab === 'tagged' ? <TaggedImages images={taggedImages} /> : null}
          {activeTab === 'data' ? <PersonData externalLinks={externalLinks} translations={translations} /> : null}
        </div>
      </div>
    </section>
  )
}

function CreditsGrid({ title, items }: { title: string; items: MediaSummary[] }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      {items.length > 0 ? <MediaGrid items={items} /> : <EmptyState title="Sin creditos" message="No hay resultados para esta seccion." />}
    </div>
  )
}

function PersonImages({ images }: { images: PersonImage[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/30">
          <div className="aspect-[2/3]">
            <img src={image.url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" />
          </div>
          <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            {image.width && image.height ? `${image.width} x ${image.height}` : 'Imagen'}
          </div>
        </a>
      ))}
    </div>
  )
}

function TaggedImages({ images }: { images: PersonTaggedImage[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/30">
          <div className="aspect-video">
            <img src={image.url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" />
          </div>
          <div className="px-3 py-2 text-sm">
            <p className="line-clamp-1 font-semibold">{image.media?.title ?? 'Imagen etiquetada'}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{image.media?.mediaType ?? ''}</p>
          </div>
        </a>
      ))}
    </div>
  )
}

function PersonData({ externalLinks, translations }: { externalLinks: MediaExternalLink[]; translations: MediaTranslation[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="text-xl font-semibold">Links externos</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {externalLinks.map((link) => {
            const href = safeExternalUrl(link.url)
            return href ? (
              <a key={`${link.site}-${link.id}`} href={href} target="_blank" rel="noreferrer" className="secondary-action">
                {link.site}
              </a>
            ) : null
          })}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Traducciones</h2>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-white/10">
          {translations.slice(0, 16).map((translation) => (
            <div key={`${translation.languageCode}-${translation.countryCode}`} className="grid gap-2 border-t border-white/10 px-3 py-2 text-sm first:border-t-0 sm:grid-cols-3">
              <span className="min-w-0 break-words font-medium">{[translation.languageCode, translation.countryCode].filter(Boolean).join('-')}</span>
              <span className="min-w-0 break-words text-[var(--color-text-secondary)]">{translation.englishName}</span>
              <span className="min-w-0 break-words text-[var(--color-text-secondary)]">{translation.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) {
    return ''
  }

  return value.slice(0, 4)
}
