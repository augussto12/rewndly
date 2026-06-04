import { useState } from 'react'

export function AdminConfirmDialog({
  title,
  actionLabel,
  onConfirm,
}: {
  title: string
  actionLabel: string
  onConfirm: (reason: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="danger-action">
        {actionLabel}
      </button>
    )
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-red-400/30 bg-red-950/20 p-3">
      <p className="text-sm font-semibold text-red-100">{title}</p>
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo" rows={2} className="field mt-2 text-sm" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => {
            onConfirm(reason.trim() || null)
            setOpen(false)
            setReason('')
          }}
          className="danger-action"
        >
          Confirmar
        </button>
        <button onClick={() => setOpen(false)} className="secondary-action">
          Cancelar
        </button>
      </div>
    </div>
  )
}
