import { useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminConfirmDialog } from '../../features/admin/components/AdminConfirmDialog'
import { AdminStatusBadge } from '../../features/admin/components/AdminStatusBadge'
import { useAdminUser, useDeleteAdminUser, useDisableAdminUser, useEnableAdminUser } from '../../features/admin/hooks/useAdmin'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminUserDetailsPage() {
  const { id } = useParams()
  const { data, isError, isLoading } = useAdminUser(id)
  const disableUser = useDisableAdminUser()
  const enableUser = useEnableAdminUser()
  const deleteUser = useDeleteAdminUser()

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {data ? (
          <section className="surface-panel max-w-4xl p-6">
            <p className="kicker">Usuario</p>
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">@{data.username}</p>
            <h1 className="mt-2 text-3xl font-semibold">{data.displayName}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminStatusBadge value={data.role} />
              <AdminStatusBadge value={data.isDisabled ? 'Disabled' : 'Enabled'} />
              <AdminStatusBadge value={data.isDeleted ? 'Deleted' : 'Active'} />
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Email" value={data.email} />
              <Info label="Creado" value={new Date(data.createdAt).toLocaleString()} />
              <Info label="Ultimo login" value={data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString() : 'Nunca'} />
              <Info label="Email verificado" value={data.emailVerifiedAt ? new Date(data.emailVerifiedAt).toLocaleString() : 'No'} />
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.isDisabled ? (
                <button onClick={() => void enableUser.mutateAsync({ id: data.id, reason: 'Admin enable' })} className="secondary-action">
                  Rehabilitar
                </button>
              ) : (
                <AdminConfirmDialog title="Deshabilitar usuario" actionLabel="Deshabilitar" onConfirm={(reason) => void disableUser.mutateAsync({ id: data.id, reason })} />
              )}
              {!data.isDeleted ? <AdminConfirmDialog title="Soft delete usuario" actionLabel="Eliminar" onConfirm={(reason) => void deleteUser.mutateAsync({ id: data.id, reason })} /> : null}
            </div>
          </section>
        ) : null}
      </main>
    </AdminLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] p-3"><dt className="text-[var(--color-text-secondary)]">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>
}
