import { useState } from 'react'
import { BarList } from '../../components/charts/BarList'
import { chartColors } from '../../components/charts/chartColors'
import { Sparkline } from '../../components/charts/Sparkline'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminMetricCard } from '../../features/admin/components/AdminMetricCard'
import {
  useAdminActivitySeries,
  useAdminCloudflareAnalytics,
  useAdminDashboard,
  useAdminMdbListStatus,
} from '../../features/admin/hooks/useAdmin'
import type {
  AdminActivityPoint,
  AdminCloudflareAnalytics,
  AdminMdbListStatus,
} from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

const RANGES = [7, 30, 90] as const

const numberFormat = new Intl.NumberFormat('es-AR')

export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(30)
  const dashboard = useAdminDashboard()
  const activity = useAdminActivitySeries(days)
  const mdblist = useAdminMdbListStatus()
  const cloudflare = useAdminCloudflareAnalytics(days)

  return (
    <AdminLayout>
      <main className="px-4 py-8 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="kicker">Admin</p>
            <h1 className="mt-3 text-4xl font-semibold">Dashboard</h1>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Actividad del sitio, salud de las integraciones y visitas reales de Rewndly.
            </p>
          </div>
          <RangeSelector value={days} onChange={setDays} />
        </header>

        <Section title="Totales" kicker="Acumulado">
          {dashboard.isLoading ? <LoadingSkeleton /> : null}
          {dashboard.isError ? <ErrorState /> : null}
          {dashboard.data ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard label="Usuarios totales" value={numberFormat.format(dashboard.data.totalUsers)} />
              <AdminMetricCard label="Activos" value={numberFormat.format(dashboard.data.activeUsers)} />
              <AdminMetricCard label="Películas guardadas" value={numberFormat.format(dashboard.data.savedMovies)} />
              <AdminMetricCard label="Series guardadas" value={numberFormat.format(dashboard.data.savedSeries)} />
              <AdminMetricCard label="Reseñas" value={numberFormat.format(dashboard.data.reviewsCreated)} />
              <AdminMetricCard label="Listas" value={numberFormat.format(dashboard.data.listsCreated)} />
              <AdminMetricCard label="Amistades" value={numberFormat.format(dashboard.data.friendshipsCreated)} />
              <AdminMetricCard label="Fallos login 24h" value={numberFormat.format(dashboard.data.failedLoginsLast24Hours)} />
            </div>
          ) : null}
        </Section>

        <Section title="Actividad" kicker={`Últimos ${days} días`}>
          {activity.isLoading ? <LoadingSkeleton /> : null}
          {activity.isError ? <ErrorState /> : null}
          {activity.data ? (
            <ActivityBlock points={activity.data.points} activeToday={activity.data.activeUsersToday} active7={activity.data.activeUsersLast7Days} active30={activity.data.activeUsersLast30Days} />
          ) : null}
        </Section>

        <Section title="Salud de integraciones" kicker="Servicios externos">
          <div className="grid gap-4 lg:grid-cols-2">
            {mdblist.data ? (
              <MdbListHealth status={mdblist.data} />
            ) : (
              <HealthFallback name="MDBList" error={mdblist.isError} />
            )}
            {cloudflare.data ? (
              <CloudflareHealth analytics={cloudflare.data} />
            ) : (
              <HealthFallback name="Cloudflare" error={cloudflare.isError} />
            )}
          </div>
        </Section>

        <Section title="Visitas reales" kicker="Cloudflare">
          {cloudflare.isLoading ? <LoadingSkeleton /> : null}
          {cloudflare.isError ? <ErrorState /> : null}
          {cloudflare.data ? <CloudflareBlock analytics={cloudflare.data} /> : null}
        </Section>

        {dashboard.data ? (
          <Section title="Contenido destacado" kicker="Ranking">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Más guardado"
                items={dashboard.data.mostSavedContent.map((item) => ({
                  key: `${item.mediaType}-${item.tmdbId}`,
                  label: `${item.title} · ${numberFormat.format(item.count)}`,
                }))}
              />
              <Panel
                title="Mejor puntuado"
                items={dashboard.data.topRatedContent.map((item) => ({
                  key: `${item.mediaType}-${item.tmdbId}`,
                  label: `${item.title} · ${item.averageRating.toFixed(1)}`,
                }))}
              />
            </div>
          </Section>
        ) : null}
      </main>
    </AdminLayout>
  )
}

function ActivityBlock({
  points,
  activeToday,
  active7,
  active30,
}: {
  points: AdminActivityPoint[]
  activeToday: number
  active7: number
  active30: number
}) {
  const labels = points.map((point) => shortDate(point.date))
  const sum = (selector: (point: AdminActivityPoint) => number) => points.reduce((total, point) => total + selector(point), 0)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SparkTile label="Registros" value={sum((p) => p.registrations)} values={points.map((p) => p.registrations)} color={chartColors.teal} />
        <SparkTile label="Logins" value={sum((p) => p.logins)} values={points.map((p) => p.logins)} color={chartColors.violet} />
        <SparkTile label="Reseñas" value={sum((p) => p.reviews)} values={points.map((p) => p.reviews)} color={chartColors.rose} />
        <SparkTile label="Agregados a biblioteca" value={sum((p) => p.libraryItems)} values={points.map((p) => p.libraryItems)} color={chartColors.amber} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Usuarios" subtitle="Registros, logins y activos por día">
          <TimeSeriesChart
            labels={labels}
            series={[
              { label: 'Registros', color: chartColors.teal, values: points.map((p) => p.registrations), fill: true },
              { label: 'Logins', color: chartColors.violet, values: points.map((p) => p.logins) },
              { label: 'Activos (DAU)', color: chartColors.amber, values: points.map((p) => p.activeUsers) },
            ]}
          />
        </ChartPanel>
        <ChartPanel title="Contenido" subtitle="Reseñas, biblioteca y listas por día">
          <TimeSeriesChart
            labels={labels}
            series={[
              { label: 'Reseñas', color: chartColors.rose, values: points.map((p) => p.reviews), fill: true },
              { label: 'Biblioteca', color: chartColors.teal, values: points.map((p) => p.libraryItems) },
              { label: 'Listas', color: chartColors.amber, values: points.map((p) => p.lists) },
            ]}
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Activos hoy" value={numberFormat.format(activeToday)} />
        <AdminMetricCard label="Activos 7 días" value={numberFormat.format(active7)} />
        <AdminMetricCard label="Activos 30 días" value={numberFormat.format(active30)} />
      </div>
    </div>
  )
}

function MdbListHealth({ status }: { status: AdminMdbListStatus }) {
  const state = !status.enabled
    ? { label: 'No configurado', tone: 'neutral' as const }
    : status.available
      ? { label: 'Activo', tone: 'ok' as const }
      : { label: status.disabledReason === 'AuthFailure' ? 'Pausado (auth)' : 'Pausado (cuota)', tone: 'warn' as const }

  const totalCoverage = status.titlesWithRatings + status.titlesWithoutData

  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MDBList</h3>
        <StatusDot tone={state.tone} label={state.label} />
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Ratings de IMDb, Rotten Tomatoes y Metacritic.</p>

      {status.dailyRequestLimit != null ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Cuota diaria</span>
            <span className="tabular-nums">
              {numberFormat.format(status.requestsUsedToday ?? 0)} / {numberFormat.format(status.dailyRequestLimit)}
            </span>
          </div>
          <Meter value={status.requestsUsedToday ?? 0} max={status.dailyRequestLimit} color={chartColors.teal} />
        </div>
      ) : null}

      {status.disabledUntil ? (
        <p className="mt-3 text-xs text-[var(--color-amber,#fbbf24)]">
          Reintenta {new Date(status.disabledUntil).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[var(--radius-sm)] bg-white/[0.04] p-3">
          <p className="text-lg font-semibold tabular-nums">{numberFormat.format(status.titlesWithRatings)}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Con ratings en cache</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-white/[0.04] p-3">
          <p className="text-lg font-semibold tabular-nums">{numberFormat.format(status.titlesWithoutData)}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Sin datos ({percent(status.titlesWithoutData, totalCoverage)})</p>
        </div>
      </div>
    </section>
  )
}

function CloudflareHealth({ analytics }: { analytics: AdminCloudflareAnalytics }) {
  const state = !analytics.enabled
    ? { label: 'No configurado', tone: 'neutral' as const }
    : analytics.live
      ? { label: 'Conectado', tone: 'ok' as const }
      : { label: 'Sin respuesta', tone: 'warn' as const }

  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cloudflare</h3>
        <StatusDot tone={state.tone} label={state.label} />
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Analíticas de tráfico y visitas humanas.</p>

      {analytics.enabled ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <ConfigLine ok={analytics.zoneConfigured} label="Zone analytics (tráfico)" />
          <ConfigLine ok={analytics.rumConfigured} label="Web Analytics (humanos)" />
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Configurá <code className="text-[var(--color-accent-light)]">CLOUDFLARE_API_TOKEN</code> y el zone/site id para
          activarlo.
        </p>
      )}
    </section>
  )
}

function CloudflareBlock({ analytics }: { analytics: AdminCloudflareAnalytics }) {
  if (!analytics.enabled) {
    return (
      <div className="surface-panel p-6 text-sm text-[var(--color-text-secondary)]">
        <p className="text-[var(--color-text-primary)]">Cloudflare todavía no está conectado.</p>
        <p className="mt-2">
          Para ver cuántas personas reales entran a Rewndly: creá un API token con permiso «Account Analytics: Read»,
          activá Web Analytics en tu dominio, y cargá <code className="text-[var(--color-accent-light)]">CLOUDFLARE_API_TOKEN</code>,{' '}
          <code className="text-[var(--color-accent-light)]">CLOUDFLARE_ZONE_ID</code>,{' '}
          <code className="text-[var(--color-accent-light)]">CLOUDFLARE_ACCOUNT_TAG</code> y{' '}
          <code className="text-[var(--color-accent-light)]">CLOUDFLARE_SITE_TAG</code>.
        </p>
      </div>
    )
  }

  const labels = analytics.points.map((point) => shortDate(point.date))
  const hasPoints = analytics.points.length > 0

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Humanos hoy"
          value={analytics.rumConfigured ? numberFormat.format(analytics.humanVisitsToday ?? 0) : '—'}
        />
        <AdminMetricCard
          label="Humanos 7 días"
          value={analytics.rumConfigured ? numberFormat.format(analytics.humanVisitsLast7Days ?? 0) : '—'}
        />
        <AdminMetricCard label="Únicos (pico/día)" value={numberFormat.format(analytics.totalUniques)} />
        <AdminMetricCard label="Requests totales" value={numberFormat.format(analytics.totalRequests)} />
      </div>

      {hasPoints ? (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <ChartPanel title="Tráfico" subtitle="Requests, únicos y visitas humanas por día">
            <TimeSeriesChart
              labels={labels}
              series={[
                { label: 'Requests', color: chartColors.teal, values: analytics.points.map((p) => p.requests), fill: true },
                { label: 'Únicos', color: chartColors.violet, values: analytics.points.map((p) => p.uniques) },
                ...(analytics.rumConfigured
                  ? [{ label: 'Humanos', color: chartColors.rose, values: analytics.points.map((p) => p.humanVisits ?? 0) }]
                  : []),
              ]}
            />
          </ChartPanel>
          <ChartPanel title="Top países" subtitle="Por requests en el período">
            <BarList
              items={analytics.topCountries.map((country) => ({ label: country.country, value: country.requests }))}
              color={chartColors.violet}
              emptyLabel="Sin datos de países todavía."
            />
          </ChartPanel>
        </div>
      ) : (
        <p className="surface-panel p-6 text-sm text-[var(--color-text-secondary)]">
          Conectado, esperando el primer bloque de datos de Cloudflare.
        </p>
      )}
    </div>
  )
}

function RangeSelector({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-1 text-sm">
      {RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={`rounded-[var(--radius-sm)] px-3 py-1.5 transition ${
            value === range
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          {range}d
        </button>
      ))}
    </div>
  )
}

function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4">
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="surface-panel p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
      {children}
    </div>
  )
}

function SparkTile({ label, value, values, color }: { label: string; value: number; values: number[]; color: string }) {
  return (
    <div className="surface-panel-muted relative overflow-hidden p-4">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" />
      <p className="text-2xl font-semibold tabular-nums">{numberFormat.format(value)}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{label}</p>
      <div className="mt-3">
        <Sparkline values={values} color={color} ariaLabel={`Tendencia de ${label}`} />
      </div>
    </div>
  )
}

function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  const barColor = ratio > 0.9 ? chartColors.rose : ratio > 0.7 ? chartColors.amber : color
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, backgroundColor: barColor }} />
    </div>
  )
}

function StatusDot({ tone, label }: { tone: 'ok' | 'warn' | 'neutral'; label: string }) {
  const color = tone === 'ok' ? chartColors.teal : tone === 'warn' ? chartColors.amber : 'var(--color-text-secondary)'
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function ConfigLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ok ? chartColors.teal : 'var(--color-text-secondary)' }} />
      <span className={ok ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>{label}</span>
    </span>
  )
}

function Panel({ title, items }: { title: string; items: Array<{ key: string; label: string }> }) {
  return (
    <section className="surface-panel p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-2 text-sm text-[var(--color-text-secondary)]">
        {items.length ? items.map((item) => <p key={item.key}>{item.label}</p>) : <p>Sin datos</p>}
      </div>
    </section>
  )
}

function HealthFallback({ name, error }: { name: string; error: boolean }) {
  return (
    <section className="surface-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        <StatusDot tone={error ? 'warn' : 'neutral'} label={error ? 'Error al cargar' : 'Cargando…'} />
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {error ? 'No se pudo obtener el estado.' : 'Consultando estado…'}
      </p>
    </section>
  )
}

function shortDate(iso: string) {
  const [, month, day] = iso.split('-')
  return `${Number(day)}/${Number(month)}`
}

function percent(part: number, total: number) {
  if (total <= 0) {
    return '0%'
  }
  return `${Math.round((part / total) * 100)}%`
}
