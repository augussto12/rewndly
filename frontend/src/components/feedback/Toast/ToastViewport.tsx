import { useSyncExternalStore } from 'react'
import { dismissToast, getToastsSnapshot, subscribeToToasts } from './toastStore'
import type { ToastMessage } from './toastStore'

const toneStyles: Record<ToastMessage['tone'], string> = {
  success: 'border-emerald-300/35 bg-emerald-950/88 text-emerald-50 shadow-emerald-950/30',
  error: 'border-rose-300/35 bg-rose-950/90 text-rose-50 shadow-rose-950/35',
  info: 'border-sky-300/32 bg-slate-950/90 text-sky-50 shadow-slate-950/35',
}

const toneLabels: Record<ToastMessage['tone'], string> = {
  success: 'OK',
  error: 'Error',
  info: 'Info',
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
          className={`pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[var(--radius-md)] border p-3 shadow-2xl backdrop-blur-xl ${toneStyles[message.tone]}`}
        >
          <span className="mt-0.5 rounded-[var(--radius-sm)] border border-white/15 bg-white/10 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
            {toneLabels[message.tone]}
          </span>
          <span className="min-w-0">
            <strong className="block text-sm leading-5">{message.title}</strong>
            {message.description ? <span className="mt-1 block text-sm leading-5 text-white/75">{message.description}</span> : null}
          </span>
          <button
            type="button"
            onClick={() => dismissToast(message.id)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.08] text-sm font-semibold text-white/80 transition hover:bg-white/[0.14] hover:text-white"
            aria-label="Cerrar notificacion"
          >
            x
          </button>
        </article>
      ))}
    </div>
  )
}
