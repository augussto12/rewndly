const DEFAULT_OPTIONS = [12, 24, 48]

type PageSizeSelectProps = {
  value: number
  onChange: (size: number) => void
  options?: number[]
  className?: string
}

/** Pill-style "por página" selector, matching the app's SegmentedControl look. */
export function PageSizeSelect({ value, onChange, options = DEFAULT_OPTIONS, className = '' }: PageSizeSelectProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Por página</span>
      <div role="group" aria-label="Cantidad por página" className="grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-white/10 bg-black/25 p-1">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                active
                  ? 'bg-gradient-to-b from-violet-500/32 to-violet-500/18 text-white shadow-[inset_0_0_0_1px_rgba(216,180,254,0.3)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
