type SearchInputProps = {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function SearchInput({ value, placeholder, onChange }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">Buscar</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field min-h-12"
      />
    </label>
  )
}
