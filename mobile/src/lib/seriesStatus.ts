const statusLabels: Record<string, string> = {
  'Returning Series': 'En emision',
  'Ended': 'Finalizada',
  'Canceled': 'Cancelada',
  'In Production': 'En produccion',
  'Planned': 'Planeada',
  'Pilot': 'Piloto'
}

export function translateSeriesStatus(status: string | null): string | null {
  if (!status) {
    return null
  }

  return statusLabels[status] ?? status
}
