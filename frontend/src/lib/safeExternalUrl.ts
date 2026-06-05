export function safeExternalUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  const candidate = trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed

  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
