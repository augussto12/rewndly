// Placeholder that mirrors MediaGrid / PersonGrid so the loading state matches the
// real layout (no jump when results arrive). Same responsive columns as the grids.
export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="aspect-[2/3] animate-pulse rounded-[var(--radius-md)] border border-white/10 bg-white/[0.05]" />
          <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  )
}
