export function VisibilityBadge({ value }: { value: string }) {
  const label = value === 'FriendsOnly' ? 'Solo amigos' : value === 'Private' ? 'Privado' : 'Publico'
  const tone =
    value === 'Private'
      ? 'border-amber-200/20 bg-amber-950/24 text-amber-100'
      : value === 'FriendsOnly'
        ? 'border-sky-200/20 bg-sky-950/24 text-sky-100'
        : 'border-violet-200/20 bg-[var(--color-accent-soft)] text-violet-100'

  return <span className={`rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs ${tone}`}>{label}</span>
}
