type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Numbered pagination with first/last + windowed pages and ellipsis on desktop,
 * collapsing to a compact "Página X de N" with prev/next arrows on mobile.
 */
export function Pagination({ page, pageCount, onPageChange, className = '' }: PaginationProps) {
  if (pageCount <= 1) {
    return null
  }

  const pages = getPageWindow(page, pageCount)

  return (
    <nav aria-label="Paginación" className={`flex items-center justify-center gap-1.5 ${className}`.trim()}>
      <ArrowButton label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)} direction="prev" />

      <span className="min-w-[6.5rem] text-center text-sm font-medium text-[var(--color-text-secondary)] sm:hidden">
        Página {page} de {pageCount}
      </span>

      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="grid h-10 w-6 place-items-center text-sm text-white/35" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? 'page' : undefined}
              aria-label={`Página ${entry}`}
              onClick={() => onPageChange(entry)}
              className={`grid h-10 min-w-10 place-items-center rounded-[var(--radius-sm)] border px-2 text-sm font-semibold transition ${
                entry === page
                  ? 'border-violet-300/50 bg-violet-500/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'border-white/10 bg-white/[0.04] text-[var(--color-text-secondary)] hover:border-white/25 hover:text-white'
              }`}
            >
              {entry}
            </button>
          ),
        )}
      </div>

      <ArrowButton label="Página siguiente" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} direction="next" />
    </nav>
  )
}

function ArrowButton({ label, disabled, onClick, direction }: { label: string; disabled: boolean; onClick: () => void; direction: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-violet-300/35 hover:bg-violet-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {direction === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )
}

function getPageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  if (left > 2) {
    pages.push('ellipsis')
  }

  for (let page = left; page <= right; page += 1) {
    pages.push(page)
  }

  if (right < total - 1) {
    pages.push('ellipsis')
  }

  pages.push(total)
  return pages
}
