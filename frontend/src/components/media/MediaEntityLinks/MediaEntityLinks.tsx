import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type {
  CollectionSummary,
  CompanySummary,
  NetworkSummary,
} from '../../../features/public-media/types/publicMedia.types'

type MediaEntityLinksProps = {
  collection?: CollectionSummary | null
  companies?: CompanySummary[]
  networks?: NetworkSummary[]
}

export function MediaEntityLinks({ collection, companies = [], networks = [] }: MediaEntityLinksProps) {
  if (!collection && companies.length === 0 && networks.length === 0) {
    return null
  }

  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 pb-12 pt-16 sm:-mt-14 sm:px-6 sm:pt-20">
      <div className="surface-panel overflow-hidden p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden="true" />
          <p className="kicker shrink-0">Universo TMDB</p>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden="true" />
        </div>
        <div className="mt-4 space-y-6">
          {collection ? (
            <div>
              <h2 className="text-sm font-semibold text-white">Saga o coleccion</h2>
              <EntityTile
                to={`/collections/${collection.tmdbId}`}
                title={collection.name}
                imageUrl={collection.posterUrl ?? collection.backdropUrl}
                fallback="Coleccion"
                variant="wide"
              />
            </div>
          ) : null}

          {companies.length > 0 ? (
            <EntityRail title="Productoras">
              {companies.slice(0, 6).map((company) => (
                <EntityTile
                  key={company.tmdbId}
                  to={`/companies/${company.tmdbId}`}
                  title={company.name}
                  subtitle={company.originCountry}
                  imageUrl={company.logoUrl}
                  fallback="Compania"
                />
              ))}
            </EntityRail>
          ) : null}

          {networks.length > 0 ? (
            <EntityRail title="Networks">
              {networks.slice(0, 6).map((network) => (
                <EntityTile
                  key={network.tmdbId}
                  to={`/networks/${network.tmdbId}`}
                  title={network.name}
                  subtitle={network.originCountry}
                  imageUrl={network.logoUrl}
                  fallback="Network"
                />
              ))}
            </EntityRail>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EntityRail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="relative mt-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
        <div className="scrollbar-cinema flex gap-3 overflow-x-auto pb-4">{children}</div>
      </div>
    </div>
  )
}

function EntityTile({
  to,
  title,
  subtitle,
  imageUrl,
  fallback,
  variant = 'rail',
}: {
  to: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  fallback: string
  variant?: 'rail' | 'wide'
}) {
  return (
    <Link
      to={to}
      className={`group flex min-h-24 items-center gap-3 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-violet-200/28 hover:bg-white/[0.06] ${
        variant === 'wide' ? 'mt-3 max-w-xl' : 'min-w-[13.5rem] max-w-[13.5rem]'
      }`}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white/[0.08]">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-contain p-2 transition group-hover:scale-105" loading="lazy" />
        ) : (
          <span className="px-1 text-center text-[10px] text-[var(--color-text-secondary)]">{fallback}</span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subtitle}</p> : null}
      </div>
    </Link>
  )
}
