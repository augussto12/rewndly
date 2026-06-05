import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../useAuth'

type ProtectedRouteProps = {
  requiredRole?: string
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center bg-[var(--color-background)] p-6 text-[var(--color-text-secondary)]">
        <div className="surface-panel p-5 text-sm">Cargando sesion...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
