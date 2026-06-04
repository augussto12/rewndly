import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminEventRow } from '../../features/admin/components/AdminEventRow'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminAuditLogs } from '../../features/admin/hooks/useAdmin'
import type { AdminAuditLog } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminAuditLogsPage() {
  const { data, isError, isLoading } = useAdminAuditLogs()
  return <AdminLayout><main className="px-4 py-8 lg:px-8"><Header title="Audit logs" />{isLoading ? <LoadingSkeleton /> : null}{isError ? <ErrorState /> : null}{data ? <><AdminTable<AdminAuditLog> items={data.items} columns={[
    { header: 'Accion', cell: (log) => <AdminEventRow title={log.action} meta={`${log.targetType} ${log.targetId ?? ''}`} /> },
    { header: 'Admin', cell: (log) => log.adminUsername },
    { header: 'Motivo', cell: (log) => log.reason ?? '-' },
    { header: 'IP', cell: (log) => log.ipAddress ?? '-' },
    { header: 'Fecha', cell: (log) => new Date(log.createdAt).toLocaleString() },
  ]} /><AdminPagination page={data.page} pageSize={data.pageSize} total={data.total} /></> : null}</main></AdminLayout>
}

function Header({ title }: { title: string }) {
  return <header className="mb-8"><p className="kicker">Auditoria</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1></header>
}
