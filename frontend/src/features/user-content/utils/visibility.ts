export function visibilityLabel(value: string) {
  if (value === 'Public') return 'Pública'
  if (value === 'FriendsOnly') return 'Solo amigos'
  if (value === 'Private') return 'Privada'
  return value
}

export function visibilityToneClass(value: string) {
  if (value === 'Private') return 'border-amber-300/28 bg-amber-400/10 text-amber-100'
  if (value === 'FriendsOnly') return 'border-sky-300/25 bg-sky-400/10 text-sky-100'
  return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
}

export function visibilityChipClass(value: string) {
  return [
    'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
    visibilityToneClass(value),
  ].join(' ')
}
