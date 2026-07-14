import type { ClientPagination } from './useClientPagination'
import { Pagination } from './Pagination'
import { PageSizeSelect } from './PageSizeSelect'

type PaginationFooterProps = {
  pager: Pick<ClientPagination<unknown>, 'page' | 'pageCount' | 'setPage' | 'pageSize' | 'setPageSize' | 'total' | 'rangeFrom' | 'rangeTo'>
  unit?: string
  pageSizeOptions?: number[]
  className?: string
}

/**
 * Footer bar for a client-paginated list: "showing X–Y of Z", numbered pagination,
 * and the per-page selector. Stacks and centers on mobile, spreads out on desktop.
 * Renders nothing for an empty list.
 */
export function PaginationFooter({ pager, unit = 'ítems', pageSizeOptions, className = '' }: PaginationFooterProps) {
  const options = pageSizeOptions ?? [12, 24, 48]
  // Nothing to paginate if even the smallest page size fits the whole list.
  if (pager.total <= Math.min(...options)) {
    return null
  }

  return (
    <div className={`mt-8 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-between ${className}`.trim()}>
      <p className="order-2 text-xs text-[var(--color-text-secondary)] sm:order-1">
        Mostrando {pager.rangeFrom}–{pager.rangeTo} de {pager.total} {unit}
      </p>
      <div className="order-1 sm:order-2">
        <Pagination page={pager.page} pageCount={pager.pageCount} onPageChange={pager.setPage} />
      </div>
      <div className="order-3">
        <PageSizeSelect value={pager.pageSize} onChange={pager.setPageSize} options={options} />
      </div>
    </div>
  )
}
