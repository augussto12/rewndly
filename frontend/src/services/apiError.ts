type ApiErrorDetails = {
  message?: string
  title?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly details: ApiErrorDetails | null

  constructor(
    message: string,
    status: number,
    details: ApiErrorDetails | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function createApiError(response: Response): Promise<ApiError> {
  const details = await readErrorDetails(response)
  const message = getDetailsMessage(details) ?? getStatusMessage(response.status)

  return new ApiError(message, response.status, details)
}

export function getErrorMessage(error: unknown, fallback = 'La acción no se pudo completar. Probá nuevamente.'): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

async function readErrorDetails(response: Response): Promise<ApiErrorDetails | null> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    return null
  }

  try {
    const payload = (await response.json()) as unknown
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const candidate = payload as Record<string, unknown>
    return {
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      title: typeof candidate.title === 'string' ? candidate.title : undefined,
      errors: normalizeValidationErrors(candidate.errors),
    }
  } catch {
    return null
  }
}

function normalizeValidationErrors(errors: unknown): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object') {
    return undefined
  }

  return Object.entries(errors as Record<string, unknown>).reduce<Record<string, string[]>>((result, [field, value]) => {
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string')
      if (messages.length > 0) {
        result[field] = messages
      }
    }

    return result
  }, {})
}

function getDetailsMessage(details: ApiErrorDetails | null): string | null {
  if (!details) {
    return null
  }

  if (details.errors && Object.keys(details.errors).length > 0) {
    return Object.entries(details.errors)
      .flatMap(([field, messages]) => messages.map((message) => `${getFieldLabel(field)}: ${translateMessage(message)}`))
      .join(' ')
  }

  const message = details.message ?? details.title
  return message ? translateMessage(message) : null
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    Username: 'Usuario',
    Email: 'Correo',
    Password: 'Contraseña',
    CurrentPassword: 'Contraseña actual',
    NewPassword: 'Contraseña nueva',
    ConfirmNewPassword: 'Confirmación',
    DisplayName: 'Nombre visible',
    Identifier: 'Correo o usuario',
    MediaType: 'Tipo de contenido',
    TmdbId: 'Contenido',
    Status: 'Estado',
    Rating: 'Rating',
    RatingSnapshot: 'Rating',
    Title: 'Título',
    Body: 'Reseña',
    Visibility: 'Privacidad',
    Description: 'Descripción',
    Position: 'Posición',
    Note: 'Nota',
    RequestToken: 'Token TMDB',
    Value: 'Valor',
  }

  return labels[field] ?? field
}

function translateMessage(message: string): string {
  const normalized = message.trim()
  const translations: Record<string, string> = {
    'Email is already registered.': 'Ese correo ya está registrado. Probá iniciar sesión o usá otro correo.',
    'Username is already registered.': 'Ese usuario ya está registrado. Elegí otro nombre de usuario.',
    'Username or email is already registered.': 'Ese usuario o correo ya está registrado. Probá iniciar sesión o usá otros datos.',
    'This media item already exists in your library.': 'Ese contenido ya está en tu biblioteca.',
    'This media item already exists in the list.': 'Ese contenido ya está en la lista seleccionada.',
    'Media item was not found.': 'No encontramos esa película o serie en TMDB.',
    'User was not found.': 'No encontramos un usuario con ese nombre.',
    'You cannot send a friendship request to yourself.': 'No podés enviarte una solicitud a vos mismo.',
    'Friendship already exists.': 'Ya son amigos.',
    'Friendship request already exists.': 'Ya existe una solicitud pendiente entre esos usuarios.',
    'TMDB account is not connected.': 'Tu cuenta de TMDB no está conectada.',
    'Request token is required.': 'Falta el token de autorización de TMDB.',
    'TMDB request token is invalid or expired.': 'El token de TMDB es inválido o expiró. Iniciá la conexión de nuevo.',
    'Rating must be between 0.5 and 10.': 'El rating debe estar entre 0.5 y 10.',
    'Invalid or expired token.': 'El token es inválido o expiró.',
    'Invalid media type or TMDB id.': 'El tipo de contenido o el id de TMDB no es válido.',
    'One or more validation errors occurred.': 'Revisá los campos marcados.',
    'Unexpected server error': 'El servidor tuvo un error inesperado. Probá nuevamente más tarde.',
    'Current password is incorrect.': 'La contraseña actual no es correcta.',
    'New password must be different from current password.': 'La contraseña nueva debe ser distinta a la actual.',
    'Password confirmation does not match.': 'La confirmación no coincide con la contraseña nueva.',
    'Password must contain an uppercase letter.': 'Debe tener al menos una mayúscula.',
    'Password must contain a lowercase letter.': 'Debe tener al menos una minúscula.',
    'Password must contain a number.': 'Debe tener al menos un número.',
    'Password must contain a symbol.': 'Debe tener al menos un símbolo.',
    'MediaType must be Movie or Series.': 'Debe ser Película o Serie.',
    'Status must be WantToWatch, Watching, Watched or Dropped.': 'Debe ser Quiero ver, Viendo, Vista o Abandonada.',
    'Visibility must be Public, FriendsOnly or Private.': 'Debe ser Pública, Solo amigos o Privada.',
    'The Username field is required.': 'Completá el usuario.',
    'The Email field is required.': 'Completá el correo.',
    'The Password field is required.': 'Completá la contraseña.',
    'The CurrentPassword field is required.': 'Completá la contraseña actual.',
    'The NewPassword field is required.': 'Completá la contraseña nueva.',
    'The ConfirmNewPassword field is required.': 'Confirmá la contraseña nueva.',
    'The Identifier field is required.': 'Completá el correo o usuario.',
    'The Title field is required.': 'Completá el título.',
    'The Body field is required.': 'Completá la reseña.',
  }

  if (translations[normalized]) {
    return translations[normalized]
  }

  const maximumLength = normalized.match(/^The length of '(.+)' must be (.+) characters or fewer\./)
  if (maximumLength) {
    return `Debe tener ${maximumLength[2]} caracteres o menos.`
  }

  const minimumLength = normalized.match(/^The length of '(.+)' must be at least (.+) characters\./)
  if (minimumLength) {
    return `Debe tener al menos ${minimumLength[2]} caracteres.`
  }

  const greaterThan = normalized.match(/^'(.+)' must be greater than '(.+)'\./)
  if (greaterThan) {
    return `Debe ser mayor que ${greaterThan[2]}.`
  }

  const between = normalized.match(/^'(.+)' must be between (.+) and (.+)\./)
  if (between) {
    return `Debe estar entre ${between[2]} y ${between[3]}.`
  }

  return normalized
}

function getStatusMessage(status: number): string {
  if (status === 400) {
    return 'La solicitud tiene datos inválidos. Revisá los campos e intentá de nuevo.'
  }

  if (status === 401) {
    return 'Tu sesión expiró o las credenciales no son válidas. Iniciá sesión nuevamente.'
  }

  if (status === 403) {
    return 'No tenés permiso para realizar esta acción.'
  }

  if (status === 404) {
    return 'No encontramos el recurso solicitado. Puede haber sido eliminado o no pertenecer a tu cuenta.'
  }

  if (status === 409) {
    return 'La acción entra en conflicto con algo que ya existe.'
  }

  if (status >= 500) {
    return 'El servidor tuvo un problema. Probá nuevamente más tarde.'
  }

  return `La solicitud falló con estado ${status}.`
}
