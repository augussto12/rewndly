export function AdminPagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <p className="mt-4 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
      Mostrando {from}-{to} de {total}
    </p>
  )
}
