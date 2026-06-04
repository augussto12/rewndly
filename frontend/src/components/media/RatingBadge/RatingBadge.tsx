type RatingBadgeProps = {
  value: number | null
}

export function RatingBadge({ value }: RatingBadgeProps) {
  if (value === null) {
    return null
  }

  return (
    <span className="inline-flex h-8 min-w-12 items-center justify-center rounded-[var(--radius-sm)] border border-violet-200/20 bg-black/62 px-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur">
      {value.toFixed(1)}
    </span>
  )
}
