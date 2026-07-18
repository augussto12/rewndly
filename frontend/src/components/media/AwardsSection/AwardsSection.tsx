import { useState } from 'react'
import type { WikidataAward } from '../../../features/public-media/types/publicMedia.types'
import { safeExternalUrl } from '../../../lib/safeExternalUrl'

type AwardsSectionProps = {
  awards: WikidataAward[]
  wikidataId?: string | null
  title?: string
}

export function AwardsSection({ awards, wikidataId, title = 'Premios' }: AwardsSectionProps) {
  const [showNominations, setShowNominations] = useState(false)

  const won = awards.filter((award) => award.status === 'won')
  const nominated = awards.filter((award) => award.status === 'nominated')

  if (won.length === 0 && nominated.length === 0) {
    return null
  }

  const wikidataUrl = wikidataId ? safeExternalUrl(`https://www.wikidata.org/wiki/${wikidataId}`) : null

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="kicker">Reconocimiento</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        {won.length > 0 ? (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {won.length} {won.length === 1 ? 'premio' : 'premios'}
          </span>
        ) : null}
      </div>

      {won.length > 0 ? (
        <ul className="mt-5 grid gap-2.5">
          {won.map((award) => (
            <AwardRow key={awardKey(award)} award={award} won />
          ))}
        </ul>
      ) : null}

      {nominated.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowNominations((value) => !value)}
            className="text-sm font-semibold text-violet-200 transition hover:text-violet-100"
          >
            {showNominations ? 'Ocultar nominaciones' : `Ver nominaciones (${nominated.length})`}
          </button>
          {showNominations ? (
            <>
              <ul className="mt-3 grid gap-2.5">
                {nominated.map((award) => (
                  <AwardRow key={awardKey(award)} award={award} won={false} />
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                Las nominaciones en Wikidata suelen estar incompletas: puede faltar alguna.
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 border-t border-white/10 pt-3 text-xs text-[var(--color-text-secondary)]">
        Datos de{' '}
        {wikidataUrl ? (
          <a href={wikidataUrl} target="_blank" rel="noreferrer" className="text-violet-200 hover:text-violet-100">
            Wikidata
          </a>
        ) : (
          'Wikidata'
        )}
        .
      </p>
    </section>
  )
}

function AwardRow({ award, won }: { award: WikidataAward; won: boolean }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`mt-0.5 shrink-0 ${won ? 'text-[var(--color-amber,#fbbf24)]' : 'text-[var(--color-text-secondary)]'}`} aria-hidden="true">
        {won ? <TrophyIcon /> : <MedalIcon />}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-[var(--color-text-primary)]">{award.award}</span>
        {award.year ? <span className="text-[var(--color-text-secondary)]"> · {award.year}</span> : null}
        {award.detail ? <span className="block text-xs text-[var(--color-text-secondary)]">{award.detail}</span> : null}
      </span>
    </li>
  )
}

function awardKey(award: WikidataAward) {
  return `${award.status}-${award.award}-${award.year ?? 'x'}-${award.detail ?? 'x'}`
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0V4Z" />
      <path d="M9 20h6M12 15v5" />
    </svg>
  )
}

function MedalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="6" />
      <path d="M9 9 6 2M15 9l3-7M12 12v6M10.5 15h3" />
    </svg>
  )
}
