import { useSyncExternalStore } from 'react'
import { dismissToast, getToastsSnapshot, subscribeToToasts } from './toastStore'
import type { ToastMessage } from './toastStore'

const toneStyles: Record<ToastMessage['tone'], string> = {
  success: 'border-emerald-300/30 bg-[#071c18]/92 text-emerald-50 shadow-emerald-950/30',
  error: 'border-rose-300/35 bg-[#261018]/94 text-rose-50 shadow-rose-950/35',
  info: 'border-sky-300/28 bg-[#0b1528]/94 text-sky-50 shadow-slate-950/35',
  loading: 'border-violet-200/30 bg-[#111126]/94 text-violet-50 shadow-violet-950/30',
}

const toneLabels: Record<ToastMessage['tone'], string> = {
  success: 'Listo',
  error: 'Error',
  info: 'Info',
  loading: 'Guardando',
}

export function ToastViewport() {
  const messages = useSyncExternalStore(subscribeToToasts, getToastsSnapshot, getToastsSnapshot)

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[90] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(24rem,calc(100vw-2rem))]">
      {messages.map((message) => (
        <article
          key={message.id}
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 overflow-hidden rounded-[var(--radius-md)] border p-3 shadow-2xl backdrop-blur-xl ${toneStyles[message.tone]}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/12 bg-white/[0.08] text-white/90">
            <ToastIcon tone={message.tone} />
          </span>
          <span className="min-w-0">
            <strong className="block text-sm leading-5">{message.title}</strong>
            {message.description ? <span className="mt-1 block text-sm leading-5 text-white/75">{message.description}</span> : null}
            <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/38">{toneLabels[message.tone]}</span>
          </span>
          <button
            type="button"
            onClick={() => dismissToast(message.id)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.08] text-white/70 transition hover:bg-white/[0.14] hover:text-white"
            aria-label="Cerrar notificación"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          {message.tone === 'loading' ? (
            <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-white/[0.08]">
              <span className="block h-full w-1/2 animate-pulse bg-violet-200/70" />
            </span>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function ToastIcon({ tone }: { tone: ToastMessage['tone'] }) {
  if (tone === 'loading') {
    return <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-100/30 border-t-violet-100" />
  }

  if (tone === 'success') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }

  if (tone === 'error') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
