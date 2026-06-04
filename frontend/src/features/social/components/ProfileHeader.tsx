import type { UserProfile } from '../types/social.types'
import { VisibilityBadge } from './VisibilityBadge'

export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.24),transparent_34%),#09090b]">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-violet-200/20 bg-[var(--color-accent-soft)] text-3xl font-semibold shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" /> : profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <VisibilityBadge value={profile.visibility} />
              {profile.isFriend ? <span className="rounded-[var(--radius-sm)] bg-white/7 px-2.5 py-1 text-xs text-[var(--color-text-secondary)]">Amigo</span> : null}
            </div>
            <h1 className="text-4xl font-semibold">{profile.displayName}</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">@{profile.username}</p>
          </div>
        </div>
        {profile.bio ? <p className="max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">{profile.bio}</p> : null}
      </div>
    </section>
  )
}
