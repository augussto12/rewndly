export function AdminStatusBadge({ value }: { value: string | boolean }) {
  const text = typeof value === 'boolean' ? (value ? 'Si' : 'No') : value
  const danger = text === 'Si' || text.includes('Deleted') || text.includes('Disabled')

  return (
    <span className={`rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs ${danger ? 'border-red-400/30 bg-red-950/30 text-red-100' : 'border-violet-200/20 bg-[var(--color-accent-soft)] text-violet-100'}`}>
      {text}
    </span>
  )
}
