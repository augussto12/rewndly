import type { ButtonHTMLAttributes, ReactNode } from 'react'

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
  children: ReactNode
  count?: number
  dot?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'min-h-8 px-3 py-1 text-xs font-medium',
  md: 'min-h-10 px-3 text-sm font-semibold',
  lg: 'min-h-11 px-3 text-sm font-semibold',
}

export function FilterChip({
  active,
  children,
  count,
  dot,
  size = 'md',
  className = '',
  type = 'button',
  ...buttonProps
}: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={[
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border transition',
        sizeClasses[size],
        active
          ? 'border-violet-400/40 bg-violet-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border-white/10 bg-white/[0.035] text-[var(--color-text-secondary)] hover:bg-white/[0.07] hover:text-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...buttonProps}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} /> : null}
      {children}
      {typeof count === 'number' ? <span className="ml-0.5 opacity-55">{count}</span> : null}
    </button>
  )
}
