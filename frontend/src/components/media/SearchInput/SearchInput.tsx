type SearchInputProps = {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function SearchInput({ value, placeholder, onChange }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">Buscar</span>
      <div className="surface-panel flex items-center gap-3 px-4 py-3">
        <span className="text-[var(--color-accent-light)]">/</span>
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-10 w-full bg-transparent text-base text-white outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>
    </label>
  )
}
