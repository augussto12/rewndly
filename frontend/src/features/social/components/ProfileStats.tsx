import type { UserStats } from '../types/social.types'

export function ProfileStats({ stats }: { stats: UserStats }) {
  const items = [
    ['Biblioteca', stats.libraryItems],
    ['Vistas', stats.watched],
    ['Resenas', stats.reviews],
    ['Listas', stats.lists],
    ['Amigos', stats.friends],
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="surface-panel-muted p-4">
          <p className="text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{label}</p>
        </div>
      ))}
    </div>
  )
}
