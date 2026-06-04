import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminConfirmDialog } from '../../features/admin/components/AdminConfirmDialog'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminStatusBadge } from '../../features/admin/components/AdminStatusBadge'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminLists, useDeleteAdminList } from '../../features/admin/hooks/useAdmin'
import type { AdminList } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminListsPage() {
  const { data, isError, isLoading } = useAdminLists()
  const deleteList = useDeleteAdminList()
  return <AdminLayout><main className="px-4 py-8 lg:px-8"><Header title="Listas" />{isLoading ? <LoadingSkeleton /> : null}{isError ? <ErrorState /> : null}{data ? <><AdminTable<AdminList> items={data.items} columns={[
    { header: 'Titulo', cell: (list) => list.title },
    { header: 'Usuario', cell: (list) => list.username },
    { header: 'Visibilidad', cell: (list) => list.visibility },
    { header: 'Deleted', cell: (list) => <AdminStatusBadge value={list.isDeleted} /> },
    { header: 'Accion', cell: (list) => list.isDeleted ? null : <AdminConfirmDialog title="Eliminar lista" actionLabel="Eliminar" onConfirm={(reason) => void deleteList.mutateAsync({ id: list.id, reason })} /> },
  ]} /><AdminPagination page={data.page} pageSize={data.pageSize} total={data.total} /></> : null}</main></AdminLayout>
}

function Header({ title }: { title: string }) {
  return <header className="mb-8"><p className="kicker">Moderacion</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1></header>
}
