import type { ReactNode } from 'react'

export type AdminColumn<T> = {
  header: string
  cell: (item: T) => ReactNode
}

export function AdminTable<T>({ columns, items }: { columns: AdminColumn<T>[]; items: T[] }) {
  return (
    <div className="surface-panel overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-white/[0.045] text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="border-b border-white/10 px-4 py-3 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.025]">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 align-top text-[var(--color-text-primary)]">
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
