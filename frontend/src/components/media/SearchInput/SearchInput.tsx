import { ClearButton } from '../../ui/ClearButton'

type SearchInputProps = {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function SearchInput({ value, placeholder, onChange }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">Buscar</span>
      <div className="relative">
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`field min-h-12 ${value ? 'pr-11' : ''}`}
        />
        {value ? <ClearButton onClick={() => onChange('')} label="Borrar búsqueda" className="right-2" /> : null}
      </div>
    </label>
  )
}
