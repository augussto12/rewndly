import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminEventRow } from '../../features/admin/components/AdminEventRow'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminActivityEvents } from '../../features/admin/hooks/useAdmin'
import type { AdminActivityEvent } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminActivityEventsPage() {
  const { data, isError, isLoading } = useAdminActivityEvents()

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        <Header title="Eventos de actividad" />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {data ? (
          <>
            <AdminTable<AdminActivityEvent>
              items={data.items}
              columns={[
                { header: 'Evento', cell: (event) => <AdminEventRow title={event.eventType} meta={event.mediaTitle ?? event.mediaType ?? 'Actividad social'} /> },
                { header: 'Usuario', cell: (event) => event.username },
                { header: 'TMDB', cell: (event) => event.tmdbId ?? '-' },
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
