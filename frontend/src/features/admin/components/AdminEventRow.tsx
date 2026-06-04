export function AdminEventRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="min-w-0">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{meta}</p>
    </div>
  )
}
