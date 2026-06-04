export function AdminFilterBar({
  value,
  onChange,
  placeholder = 'Buscar',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="surface-panel mb-5 p-4">
      <label className="block text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        Filtro
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field mt-2" />
      </label>
    </div>
  )
}
