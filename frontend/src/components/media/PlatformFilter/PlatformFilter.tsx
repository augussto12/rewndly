import type { WatchProviderOption } from '../../../features/public-media/types/publicMedia.types'

type PlatformFilterProps = {
  providers: WatchProviderOption[] | undefined
  value: string
  isLoading?: boolean
  onChange: (value: string) => void
}

export function PlatformFilter({ providers, value, isLoading = false, onChange }: PlatformFilterProps) {
  return (
    <label className="text-sm text-[var(--color-text-secondary)]">
      Plataforma
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={isLoading} className="field mt-2">
        <option value="">Todas</option>
        {providers?.map((provider) => (
          <option key={provider.providerId} value={provider.providerId}>
            {provider.name}
          </option>
        ))}
      </select>
    </label>
  )
}
