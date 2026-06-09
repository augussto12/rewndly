type RatingBadgeProps = {
  value: number | null
  source?: string
}

export function RatingBadge({ value, source }: RatingBadgeProps) {
  if (!value || value <= 0) {
    return null
  }

  const label = value.toFixed(1)

  return (
    <span className="inline-flex h-8 min-w-12 items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-violet-200/20 bg-black/62 px-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur">
      {source ? <span className="text-[0.58rem] uppercase text-violet-100/75">{source}</span> : null}
      {label}
    </span>
  )
}
