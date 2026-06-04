import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminFilterBar } from '../../features/admin/components/AdminFilterBar'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminStatusBadge } from '../../features/admin/components/AdminStatusBadge'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminUsers } from '../../features/admin/hooks/useAdmin'
import type { AdminUser } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const { data, isError, isLoading } = useAdminUsers(search)

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        <Header title="Usuarios" subtitle="Busqueda y gestion de cuentas." />
        <AdminFilterBar value={search} onChange={setSearch} placeholder="Buscar por username, email o nombre" />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {data ? (
          <>
            <AdminTable<AdminUser>
              items={data.items}
              columns={[
                { header: 'Usuario', cell: (user) => <Link to={`/admin/users/${user.id}`} className="font-medium text-[var(--color-accent-light)]">{user.username}</Link> },
                { header: 'Email', cell: (user) => user.email },
                { header: 'Rol', cell: (user) => user.role },
                { header: 'Disabled', cell: (user) => <AdminStatusBadge value={user.isDisabled} /> },
                { header: 'Deleted', cell: (user) => <AdminStatusBadge value={user.isDeleted} /> },
                { header: 'Creado', cell: (user) => new Date(user.createdAt).toLocaleDateString() },
              ]}
            />
            <AdminPagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : null}
      </main>
    </AdminLayout>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="mb-8"><p className="kicker">Admin</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1><p className="mt-3 text-[var(--color-text-secondary)]">{subtitle}</p></header>
}
