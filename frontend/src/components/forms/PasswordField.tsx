import { useId, useState } from 'react'

type PasswordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  className?: string
}

export function PasswordField({ label, value, onChange, autoComplete, className = '' }: PasswordFieldProps) {
  const id = useId()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label className={`block text-sm text-[var(--color-text-secondary)] ${className}`}>
      {label}
      <span className="relative mt-2 block">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field pr-12"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition hover:bg-white/[0.07] hover:text-white"
          aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  )
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-3.1 4.4" />
      <path d="M6.1 6.1C3.4 7.9 2 12 2 12s3.5 8 10 8a10.9 10.9 0 0 0 5.1-1.2" />
    </svg>
  )
}
