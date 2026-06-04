import { ErrorState } from '../../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { AdminConfirmDialog } from '../../features/admin/components/AdminConfirmDialog'
import { AdminPagination } from '../../features/admin/components/AdminPagination'
import { AdminStatusBadge } from '../../features/admin/components/AdminStatusBadge'
import { AdminTable } from '../../features/admin/components/AdminTable'
import { useAdminReviews, useDeleteAdminReview } from '../../features/admin/hooks/useAdmin'
import type { AdminReview } from '../../features/admin/types/admin.types'
import { AdminLayout } from '../../layouts/AdminLayout'

export function AdminReviewsPage() {
  const { data, isError, isLoading } = useAdminReviews()
  const deleteReview = useDeleteAdminReview()
  return <AdminModerationPage title="Reviews" isLoading={isLoading} isError={isError} data={data} columns={[
    { header: 'Titulo', cell: (review: AdminReview) => review.title },
    { header: 'Usuario', cell: (review: AdminReview) => review.username },
    { header: 'Media', cell: (review: AdminReview) => review.mediaTitle },
    { header: 'Deleted', cell: (review: AdminReview) => <AdminStatusBadge value={review.isDeleted} /> },
    { header: 'Accion', cell: (review: AdminReview) => review.isDeleted ? null : <AdminConfirmDialog title="Eliminar review" actionLabel="Eliminar" onConfirm={(reason) => void deleteReview.mutateAsync({ id: review.id, reason })} /> },
  ]} />
}

function AdminModerationPage<T>({ title, data, isLoading, isError, columns }: { title: string; data: { items: T[]; page: number; pageSize: number; total: number } | undefined; isLoading: boolean; isError: boolean; columns: Array<{ header: string; cell: (item: T) => React.ReactNode }> }) {
  return <AdminLayout><main className="px-4 py-8 lg:px-8"><Header title={title} />{isLoading ? <LoadingSkeleton /> : null}{isError ? <ErrorState /> : null}{data ? <><AdminTable items={data.items} columns={columns} /><AdminPagination page={data.page} pageSize={data.pageSize} total={data.total} /></> : null}</main></AdminLayout>
}

function Header({ title }: { title: string }) {
  return <header className="mb-8"><p className="kicker">Moderacion</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1></header>
}
