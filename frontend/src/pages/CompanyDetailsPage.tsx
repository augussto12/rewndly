import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { useCompanyDetails } from '../features/public-media/hooks/usePublicMedia'
import type { CompanyDetails } from '../features/public-media/types/publicMedia.types'
import { PublicLayout } from '../layouts/PublicLayout'
import { safeExternalUrl } from '../lib/safeExternalUrl'

export function CompanyDetailsPage() {
  const companyId = Number(useParams().companyId)
  const { data, isError, isLoading } = useCompanyDetails(companyId)

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(companyId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la productora" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? <CompanyProfile data={data} /> : null}
    </PublicLayout>
  )
}

function CompanyProfile({ data }: { data: CompanyDetails }) {
  return (
    <main className="page-shell">
      <EntityHeader
        eyebrow="Productora"
        name={data.name}
        description={data.description}
        logoUrl={data.logoUrl}
        meta={[data.originCountry, data.headquarters].filter(Boolean).join(' / ')}
        homepage={data.homepage}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="surface-panel p-4 sm:p-5">
          <p className="kicker">Catalogo</p>
          <h2 className="mt-2 text-2xl font-semibold">Peliculas populares</h2>
          <div className="mt-6">{data.movies.length > 0 ? <MediaGrid items={data.movies} /> : <EmptyState title="Sin peliculas" message="TMDB no devolvio peliculas para esta productora." />}</div>
        </div>

        <EntityFacts
          aliases={data.alternativeNames.map((alias) => alias.name)}
          parent={data.parentCompany ? { href: `/companies/${data.parentCompany.tmdbId}`, name: data.parentCompany.name } : null}
        />
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <p className="kicker">Series</p>
        <h2 className="mt-2 text-2xl font-semibold">Series relacionadas</h2>
        <div className="mt-6">{data.series.length > 0 ? <MediaGrid items={data.series} /> : <EmptyState title="Sin series" message="TMDB no devolvio series para esta productora." />}</div>
      </section>
    </main>
  )
}

function EntityHeader({
  eyebrow,
  name,
  description,
  logoUrl,
  meta,
  homepage,
}: {
  eyebrow: string
  name: string
  description: string | null
  logoUrl: string | null
  meta: string
  homepage: string | null
}) {
  const homepageHref = safeExternalUrl(homepage)

  return (
    <section className="grid gap-6 md:grid-cols-[8rem_1fr]">
      <div className="grid h-28 w-28 place-items-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.045] p-4 md:h-32 md:w-32">
        {logoUrl ? <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-center text-xs text-[var(--color-text-secondary)]">Sin logo</span>}
      </div>
      <div className="min-w-0">
        <p className="kicker">{eyebrow}</p>
        <h1 className="text-resilient mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{name}</h1>
        {meta ? <p className="text-resilient mt-3 text-sm text-[var(--color-text-secondary)]">{meta}</p> : null}
        {description ? <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{description}</p> : null}
        {homepageHref ? (
          <a href={homepageHref} target="_blank" rel="noreferrer" className="secondary-action mt-6 inline-flex">
            Sitio oficial
          </a>
        ) : null}
      </div>
    </section>
  )
}

function EntityFacts({ aliases, parent }: { aliases: string[]; parent: { href: string; name: string } | null }) {
  if (aliases.length === 0 && !parent) {
    return null
  }

  return (
    <aside className="surface-panel p-4 sm:p-5">
      <p className="kicker">Datos</p>
      {parent ? (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">Empresa madre</h2>
          <Link to={parent.href} className="text-resilient mt-2 inline-flex text-sm font-semibold text-violet-200 underline-offset-4 hover:underline">
            {parent.name}
          </Link>
        </div>
      ) : null}
      {aliases.length > 0 ? (
        <div className="mt-5">
          <h2 className="text-sm font-semibold">Aliases</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {aliases.slice(0, 12).map((alias) => (
              <span key={alias} className="max-w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[var(--color-text-secondary)] text-resilient">
                {alias}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
