export function AdminMetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="surface-panel-muted relative overflow-hidden p-4">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}
