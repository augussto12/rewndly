export function AdminStatusBadge({ value }: { value: string | boolean }) {
  const rawText = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value
  const danger = rawText === 'Sí' || rawText.includes('Deleted') || rawText.includes('Disabled')
  const text = translateStatus(rawText)

  return (
    <span className={`rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs ${danger ? 'border-red-400/30 bg-red-950/30 text-red-100' : 'border-violet-200/20 bg-[var(--color-accent-soft)] text-violet-100'}`}>
      {text}
    </span>
  )
}

function translateStatus(value: string) {
  const labels: Record<string, string> = {
    Disabled: 'Deshabilitado',
    Enabled: 'Habilitado',
    Deleted: 'Eliminado',
    Active: 'Activo',
  }

  return labels[value] ?? value
}
