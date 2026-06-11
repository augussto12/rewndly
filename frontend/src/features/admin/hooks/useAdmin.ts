import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../components/feedback/Toast/toastStore'
import { getErrorMessage } from '../../../services/apiError'
import {
  deleteAdminList,
  deleteAdminReview,
  deleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  getAdminActivityEvents,
  getAdminAuditLogs,
  getAdminDashboard,
  getAdminLists,
  getAdminReviews,
  getAdminSystemEvents,
  getAdminUser,
  getAdminUsers,
} from '../services/adminApi'

export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard })
}

export function useAdminUsers(search = '') {
  return useQuery({ queryKey: ['admin-users', search], queryFn: () => getAdminUsers(search) })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUser(id ?? ''), enabled: Boolean(id) })
}

export function useDisableAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => disableAdminUser(id, reason),
    onSuccess: (_user, args) => {
      toast.success('Usuario deshabilitado', 'El cambio quedó registrado en auditoría.')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-user', args.id] })
    },
    onError: (error) => notifyAdminError(error, 'No se pudo deshabilitar el usuario.'),
  })
}

export function useEnableAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => enableAdminUser(id, reason),
    onSuccess: (_user, args) => {
      toast.success('Usuario habilitado', 'El usuario puede volver a usar la cuenta.')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-user', args.id] })
    },
    onError: (error) => notifyAdminError(error, 'No se pudo habilitar el usuario.'),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminUser(id, reason),
    onSuccess: () => {
      toast.success('Usuario eliminado', 'La eliminación quedó aplicada.')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => notifyAdminError(error, 'No se pudo eliminar el usuario.'),
  })
}

export function useAdminReviews() {
  return useQuery({ queryKey: ['admin-reviews'], queryFn: getAdminReviews })
}

export function useDeleteAdminReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminReview(id, reason),
    onSuccess: () => {
      toast.success('Reseña eliminada', 'La acción administrativa quedó guardada.')
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (error) => notifyAdminError(error, 'No se pudo eliminar la reseña.'),
  })
}

export function useAdminLists() {
  return useQuery({ queryKey: ['admin-lists'], queryFn: getAdminLists })
}

export function useDeleteAdminList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminList(id, reason),
    onSuccess: () => {
      toast.success('Lista eliminada', 'La acción administrativa quedó guardada.')
      void queryClient.invalidateQueries({ queryKey: ['admin-lists'] })
    },
    onError: (error) => notifyAdminError(error, 'No se pudo eliminar la lista.'),
  })
}

export function useAdminSystemEvents() {
  return useQuery({ queryKey: ['admin-system-events'], queryFn: getAdminSystemEvents })
}

export function useAdminActivityEvents() {
  return useQuery({ queryKey: ['admin-activity-events'], queryFn: getAdminActivityEvents })
}

export function useAdminAuditLogs() {
  return useQuery({ queryKey: ['admin-audit-logs'], queryFn: getAdminAuditLogs })
}

function notifyAdminError(error: unknown, fallback: string) {
  toast.error('No se pudo completar la acción admin', getErrorMessage(error, fallback))
}
