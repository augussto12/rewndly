import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminEventRow } from '../../features/admin/components/AdminEventRow'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminSystemEvents } from '../../features/admin/hooks/useAdmin'
import type { AdminSystemEvent } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminSystemEventsPage() {
  const { data, isError, isLoading } = useAdminSystemEvents()

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        <Header title="Eventos del sistema" />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {data ? (
          <>
            <AdminTable<AdminSystemEvent>
              items={data.items}
              columns={[
                { header: 'Evento', cell: (event) => <AdminEventRow title={event.eventType} meta={event.entityType ? `${event.entityType} ${event.entityId ?? ''}` : 'Sistema'} /> },
                { header: 'Usuario', cell: (event) => event.userId ?? '-' },
                { header: 'IP', cell: (event) => event.ipAddress ?? '-' },
                { header: 'Fecha', cell: (event) => new Date(event.createdAt).toLocaleString() },
              ]}
            />
            <AdminPagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : null}
      </main>
    </AdminLayout>
  )
}

function Header({ title }: { title: string }) {
  return <header className="mb-8"><p className="kicker">Eventos</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1></header>
}
