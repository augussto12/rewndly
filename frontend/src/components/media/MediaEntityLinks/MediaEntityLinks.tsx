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
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div className="surface-panel p-4 sm:p-5">
        <p className="kicker">Universo TMDB</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          {collection ? (
            <EntityGroup title="Saga o coleccion">
              <EntityTile
                to={`/collections/${collection.tmdbId}`}
                title={collection.name}
                imageUrl={collection.posterUrl ?? collection.backdropUrl}
                fallback="Coleccion"
              />
            </EntityGroup>
          ) : null}

          {companies.length > 0 ? (
            <EntityGroup title="Productoras">
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
            </EntityGroup>
          ) : null}

          {networks.length > 0 ? (
            <EntityGroup title="Networks">
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
            </EntityGroup>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EntityGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  )
}

function EntityTile({
  to,
  title,
  subtitle,
  imageUrl,
  fallback,
}: {
  to: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  fallback: string
}) {
  return (
    <Link
      to={to}
      className="flex min-h-16 items-center gap-3 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-violet-200/28"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white/[0.06]">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" loading="lazy" /> : <span className="px-1 text-center text-[10px] text-[var(--color-text-secondary)]">{fallback}</span>}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subtitle}</p> : null}
      </div>
    </Link>
  )
}
