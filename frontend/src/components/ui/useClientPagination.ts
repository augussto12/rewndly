import { useEffect, useState } from 'react'

export type ClientPagination<T> = {
  pagedItems: T[]
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  pageCount: number
  total: number
  rangeFrom: number
  rangeTo: number
}

/**
 * Client-side pagination over an already-loaded array. Resets to page 1 whenever the
 * result set size or page size changes (e.g. filters applied), and always clamps the
 * current page into range so a page is never empty.
 */
export function useClientPagination<T>(items: T[], defaultPageSize = 24): ClientPagination<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(defaultPageSize)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage)
    }
  }, [page, safePage])

  // Filters changing the result-set size (or a new page size) should land on page 1.
  useEffect(() => {
    setPage(1)
  }, [total, pageSize])

  function setPageSize(size: number) {
    setPageSizeState(size)
    setPage(1)
  }

  const start = (safePage - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)

  return {
    pagedItems,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total,
    rangeFrom: total === 0 ? 0 : start + 1,
    rangeTo: Math.min(start + pageSize, total),
  }
}
