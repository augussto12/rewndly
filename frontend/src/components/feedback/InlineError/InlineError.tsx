type InlineErrorProps = {
  message: string
  className?: string
}

/** Shared inline error banner (the red "algo salió mal" notice used across pages). */
export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <p role="alert" className={`rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200 ${className}`.trim()}>
      {message}
    </p>
  )
}
