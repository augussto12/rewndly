type EmptyStateProps = {
  title: string
  message: string
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="surface-panel relative overflow-hidden p-7 text-center sm:p-9">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-light)] to-transparent opacity-50" />
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-accent-soft)] text-violet-100">
        +
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
    </div>
  )
}
