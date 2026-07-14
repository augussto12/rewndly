import { Navigate, useParams } from 'react-router-dom'

// Legacy alias for /profiles/:username — the canonical route is /users/:username.
// Kept as a redirect so old links keep working without duplicating the page.
export function PublicProfilePage() {
  const { username } = useParams()

  if (!username) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={`/users/${username}`} replace />
}
