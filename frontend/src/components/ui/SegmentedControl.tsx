import type { ReactNode } from 'react'

type SegmentedOption<T extends string> = { value: T; label: ReactNode }

type SegmentedControlProps<T extends string> = {
  options: Array<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  size?: 'md' | 'lg'
  className?: string
}

/**
 * Clean pill-style segmented toggle: one rounded track with the active segment
 * filled. Replaces the old "FilterChips inside a bordered box" look used for the
 * Movie/Series and library status toggles.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, size = 'md', className = '' }: SegmentedControlProps<T>) {
  const pad = size === 'lg' ? 'min-h-11 py-2.5' : 'min-h-9 py-2'

  return (
    <div role="group" aria-label={ariaLabel} className={`grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-white/10 bg-black/25 p-1 ${className}`.trim()}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 text-sm font-semibold transition ${pad} ${
              active
                ? 'bg-gradient-to-b from-violet-500/32 to-violet-500/18 text-white shadow-[inset_0_0_0_1px_rgba(216,180,254,0.3)]'
                : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
