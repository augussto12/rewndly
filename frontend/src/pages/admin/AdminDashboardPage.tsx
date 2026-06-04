import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminMetricCard } from '../../features/admin/components/AdminMetricCard'
import { useAdminDashboard } from '../../features/admin/hooks/useAdmin'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminDashboardPage() {
  const { data, isError, isLoading } = useAdminDashboard()

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        <Header title="Dashboard" subtitle="Metrica operativa inicial de Rewndly." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard label="Usuarios totales" value={data.totalUsers} />
              <AdminMetricCard label="Activos" value={data.activeUsers} />
              <AdminMetricCard label="Deshabilitados" value={data.disabledUsers} />
              <AdminMetricCard label="Eliminados" value={data.deletedUsers} />
              <AdminMetricCard label="Nuevos 7 dias" value={data.newUsersLast7Days} />
              <AdminMetricCard label="Peliculas guardadas" value={data.savedMovies} />
              <AdminMetricCard label="Series guardadas" value={data.savedSeries} />
              <AdminMetricCard label="Reviews" value={data.reviewsCreated} />
              <AdminMetricCard label="Listas" value={data.listsCreated} />
              <AdminMetricCard label="Amistades" value={data.friendshipsCreated} />
              <AdminMetricCard label="Sistema 24h" value={data.systemActionsLast24Hours} />
              <AdminMetricCard label="Fallos login 24h" value={data.failedLoginsLast24Hours} />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Panel title="Contenido mas guardado" items={data.mostSavedContent.map((item) => `${item.title} (${item.count})`)} />
              <Panel title="Mejor puntuado" items={data.topRatedContent.map((item) => `${item.title} (${item.averageRating.toFixed(1)})`)} />
            </div>
          </>
        ) : null}
      </main>
    </AdminLayout>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8 max-w-3xl">
      <p className="kicker">Admin</p>
      <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">{subtitle}</p>
    </header>
  )
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="surface-panel p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-[var(--color-text-secondary)]">
        {items.length ? items.map((item) => <p key={item}>{item}</p>) : <p>Sin datos</p>}
      </div>
    </section>
  )
}
