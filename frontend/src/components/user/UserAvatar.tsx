type UserAvatarProps = {
  displayName?: string | null
  username?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

export function UserAvatar({ displayName, username, size = 'sm', className = '' }: UserAvatarProps) {
  return (
    <span className={[size === 'lg' ? 'nav-avatar nav-avatar--lg' : 'nav-avatar', className].filter(Boolean).join(' ')}>
      {getUserInitials(displayName, username)}
    </span>
  )
}

export function getUserInitials(displayName?: string | null, username?: string | null) {
  const source = (displayName?.trim() || username?.trim() || '?').replace(/^@/, '')
  const parts = source.split(/[\s._-]+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase()
  }

  return `${Array.from(parts[0])[0] ?? ''}${Array.from(parts[1])[0] ?? ''}`.toUpperCase()
}
