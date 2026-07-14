import type { ReactNode } from 'react'

type ErrorStateProps = {
  title?: string
  message?: string
  action?: ReactNode
}

export function ErrorState({
  title = 'No pudimos cargar el contenido',
  message = 'El servicio no respondió como esperábamos. Probá nuevamente más tarde.',
  action,
}: ErrorStateProps) {
  return (
    <div className="surface-panel relative overflow-hidden p-7 text-center sm:p-9">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent opacity-60" />
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-amber-200/20 bg-amber-950/30 text-amber-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-amber-50">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-100/72">{message}</p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  )
}
