import { chartColors } from './chartColors'

export type BarListItem = {
  label: string
  value: number
}

type BarListProps = {
  items: BarListItem[]
  color?: string
  formatValue?: (value: number) => string
  emptyLabel?: string
}

/** Ranking horizontal de barras (label · barra · valor). HTML/CSS puro. */
export function BarList({
  items,
  color = chartColors.teal,
  formatValue = (value) => value.toLocaleString('es-AR'),
  emptyLabel = 'Sin datos.',
}: BarListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-text-secondary)]">{emptyLabel}</p>
  }

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="grid gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-[var(--color-text-secondary)]" title={item.label}>
            {item.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, backgroundColor: color }}
            />
          </span>
          <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{formatValue(item.value)}</span>
        </div>
      ))}
    </div>
  )
}
