type ClearButtonProps = {
  onClick: () => void
  label?: string
  className?: string
}

/** Small "×" button to clear a text field, shown only when the field has content. */
export function ClearButton({ onClick, label = 'Borrar texto', className = '' }: ClearButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-white/10 hover:text-white ${className}`.trim()}
    >
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  )
}
