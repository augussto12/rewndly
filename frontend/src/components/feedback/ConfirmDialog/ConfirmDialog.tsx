import { useEffect, useState } from 'react'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

type ConfirmState = ConfirmOptions & { resolve: (value: boolean) => void }

/**
 * Promise-based confirmation. Usage:
 *   const { confirm, confirmDialog } = useConfirm()
 *   if (await confirm({ title, message, tone: 'danger' })) { ...do it... }
 *   // render {confirmDialog} once in the tree
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  function confirm(options: ConfirmOptions) {
    return new Promise<boolean>((resolve) => setState({ ...options, resolve }))
  }

  function settle(value: boolean) {
    state?.resolve(value)
    setState(null)
  }

  const confirmDialog = state ? (
    <ConfirmDialog
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      tone={state.tone}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null

  return { confirm, confirmDialog }
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[85] grid place-items-end sm:place-items-center">
      <button type="button" aria-label={cancelLabel} className="absolute inset-0 cursor-default bg-black/62 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative m-3 w-full max-w-sm rounded-[var(--radius-md)] border border-white/12 bg-[var(--color-surface)] p-5 shadow-2xl sm:m-0"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="secondary-action">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} autoFocus className={tone === 'danger' ? 'danger-action' : 'primary-action'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
