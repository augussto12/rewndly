import { Link } from 'react-router-dom'
import { PosterCard } from '../PosterCard/PosterCard'
import type {
  MediaPerson,
  MediaSummary,
  MediaVideo,
  WatchProvider,
} from '../../../features/public-media/types/publicMedia.types'

type MediaDetailsExtrasProps = {
  mediaTitle: string
  cast: MediaPerson[]
  videos: MediaVideo[]
  watchProviders: WatchProvider[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
}

export function MediaDetailsExtras({
  mediaTitle,
  cast,
  videos,
  watchProviders,
  recommendations,
  similar,
}: MediaDetailsExtrasProps) {
  const trailer =
    videos.find((video) => video.type.toLowerCase() === 'trailer' && video.official) ??
    videos.find((video) => video.type.toLowerCase() === 'trailer') ??
    videos[0]

  const providerGroups = groupProviders(watchProviders)
  const hasProviders = providerGroups.length > 0

  if (!trailer && cast.length === 0 && !hasProviders && recommendations.length === 0 && similar.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        {trailer ? (
          <section className="surface-panel overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <p className="kicker">Video</p>
              <h2 className="mt-1 text-lg font-semibold">{trailer.name}</h2>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        ) : null}

        {hasProviders ? (
          <section className="surface-panel p-4 sm:p-5">
            <p className="kicker">Donde ver</p>
            <div className="mt-4 space-y-5">
              {providerGroups.map((group) => (
                <div key={group.type}>
                  <h2 className="text-sm font-semibold text-white">{group.type}</h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {group.items.map((provider) => (
                      <ProviderChip key={`${provider.type}-${provider.providerId}`} provider={provider} mediaTitle={mediaTitle} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {cast.length > 0 ? (
        <section className="py-10">
          <div className="mb-4">
            <p className="kicker">Reparto</p>
            <h2 className="mt-2 text-xl font-semibold">Principales</h2>
          </div>
          <div className="scrollbar-cinema flex gap-4 overflow-x-auto pb-4">
            {cast.map((person) => (
              <Link
                to={`/people/${person.tmdbId}`}
                key={person.tmdbId}
                className="min-w-[8.5rem] max-w-[8.5rem] rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-2 transition hover:-translate-y-1 hover:border-violet-200/28"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)]">
                  {person.profileUrl ? (
                    <img src={person.profileUrl} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center px-3 text-center text-xs text-[var(--color-text-secondary)]">
                      Sin foto
                    </div>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{person.name}</h3>
                {person.role ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--color-text-secondary)]">{person.role}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RelatedSection title="Recomendaciones" items={recommendations} />
      <RelatedSection title="Similares" items={similar} />
    </section>
  )
}

function ProviderChip({ provider, mediaTitle }: { provider: WatchProvider; mediaTitle: string }) {
  const href = getProviderSearchUrl(provider.name, mediaTitle)
  const className =
    'flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-2 transition hover:border-violet-200/30 hover:bg-white/[0.075]'
  const content = (
    <>
      {provider.logoUrl ? (
        <img src={provider.logoUrl} alt="" className="h-8 w-8 rounded-[var(--radius-sm)] object-cover" loading="lazy" />
      ) : null}
      <span className="text-sm font-medium">{provider.name}</span>
    </>
  )

  if (!href) {
    return <div className={className}>{content}</div>
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} aria-label={`Buscar ${mediaTitle} en ${provider.name}`}>
      {content}
    </a>
  )
}

function RelatedSection({ title, items }: { title: string; items: MediaSummary[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="mb-4">
        <p className="kicker">Explorar</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      </div>
      <div className="scrollbar-cinema flex gap-4 overflow-x-auto pb-4">
        {items.map((item) => (
          <PosterCard key={`${item.mediaType}-${item.tmdbId}`} item={item} layout="carousel" />
        ))}
      </div>
    </section>
  )
}

function groupProviders(providers: WatchProvider[]) {
  return ['Streaming', 'Alquiler', 'Compra']
    .map((type) => ({
      type,
      items: providers.filter((provider) => provider.type === type),
    }))
    .filter((group) => group.items.length > 0)
}

function getProviderSearchUrl(providerName: string, mediaTitle: string) {
  const normalizedProvider = normalizeProviderName(providerName)
  const query = encodeURIComponent(mediaTitle)

  if (normalizedProvider.includes('netflix')) {
    return `https://www.netflix.com/search?q=${query}`
  }

  if (normalizedProvider.includes('prime') || normalizedProvider.includes('amazon')) {
    return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`
  }

  if (normalizedProvider.includes('disney') || normalizedProvider.includes('star plus') || normalizedProvider.includes('star+')) {
    return `https://www.disneyplus.com/search?q=${query}`
  }

  if (normalizedProvider.includes('max') || normalizedProvider.includes('hbo')) {
    return `https://www.max.com/search?q=${query}`
  }

  if (normalizedProvider.includes('apple')) {
    return `https://tv.apple.com/search?term=${query}`
  }

  if (normalizedProvider.includes('paramount')) {
    return `https://www.paramountplus.com/search/?query=${query}`
  }

  if (normalizedProvider.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${query}`
  }

  if (normalizedProvider.includes('google play')) {
    return `https://play.google.com/store/search?q=${query}&c=movies`
  }

  if (normalizedProvider.includes('rakuten')) {
    return `https://rakuten.tv/search?q=${query}`
  }

  if (normalizedProvider.includes('mubi')) {
    return `https://mubi.com/search/films?query=${query}`
  }

  if (normalizedProvider.includes('crunchyroll')) {
    return `https://www.crunchyroll.com/search?q=${query}`
  }

  return null
}

function normalizeProviderName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
