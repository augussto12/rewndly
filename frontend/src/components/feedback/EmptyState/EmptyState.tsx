import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="surface-panel relative overflow-hidden p-7 text-center sm:p-9">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-light)] to-transparent opacity-50" />
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-accent-soft)] text-violet-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" />
          <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  )
}
