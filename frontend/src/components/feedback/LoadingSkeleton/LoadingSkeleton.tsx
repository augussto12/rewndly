export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="surface-panel h-72 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03]" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] rounded-[var(--radius-md)] border border-white/[0.08] bg-white/[0.045]" />
        ))}
      </div>
    </div>
  )
}
