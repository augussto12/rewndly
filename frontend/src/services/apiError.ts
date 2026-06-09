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

export function getErrorMessage(error: unknown, fallback = 'La accion no se pudo completar. Proba nuevamente.'): string {
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
    Email: 'Email',
    Password: 'Password',
    CurrentPassword: 'Password actual',
    NewPassword: 'Password nuevo',
    ConfirmNewPassword: 'Confirmacion',
    DisplayName: 'Nombre visible',
    Identifier: 'Email o usuario',
    MediaType: 'Tipo de contenido',
    TmdbId: 'Contenido',
    Status: 'Estado',
    Rating: 'Rating',
    RatingSnapshot: 'Rating',
    Title: 'Titulo',
    Body: 'Reseña',
    Visibility: 'Privacidad',
    Description: 'Descripcion',
    Position: 'Posicion',
    Note: 'Nota',
    RequestToken: 'Token TMDB',
    Value: 'Valor',
  }

  return labels[field] ?? field
}

function translateMessage(message: string): string {
  const normalized = message.trim()
  const translations: Record<string, string> = {
    'Email is already registered.': 'Ese email ya esta registrado. Proba iniciar sesion o usa otro email.',
    'Username is already registered.': 'Ese usuario ya esta registrado. Elegi otro nombre de usuario.',
    'Username or email is already registered.': 'Ese usuario o email ya esta registrado. Proba iniciar sesion o usa otros datos.',
    'This media item already exists in your library.': 'Ese contenido ya esta en tu biblioteca.',
    'This media item already exists in the list.': 'Ese contenido ya esta en la lista seleccionada.',
    'Media item was not found.': 'No encontramos esa pelicula o serie en TMDB.',
    'User was not found.': 'No encontramos un usuario con ese username.',
    'You cannot send a friendship request to yourself.': 'No podes enviarte una solicitud a vos mismo.',
    'Friendship already exists.': 'Ya son amigos.',
    'Friendship request already exists.': 'Ya existe una solicitud pendiente entre esos usuarios.',
    'TMDB account is not connected.': 'Tu cuenta de TMDB no esta conectada.',
    'Request token is required.': 'Falta el token de autorizacion de TMDB.',
    'TMDB request token is invalid or expired.': 'El token de TMDB es invalido o expiro. Inicia la conexion de nuevo.',
    'Rating must be between 0.5 and 10.': 'El rating debe estar entre 0.5 y 10.',
    'Invalid or expired token.': 'El token es invalido o expiro.',
    'Invalid media type or TMDB id.': 'El tipo de contenido o el id de TMDB no es valido.',
    'One or more validation errors occurred.': 'Revisa los campos marcados.',
    'Unexpected server error': 'El servidor tuvo un error inesperado. Proba nuevamente mas tarde.',
    'Current password is incorrect.': 'El password actual no es correcto.',
    'New password must be different from current password.': 'El password nuevo debe ser distinto al actual.',
    'Password confirmation does not match.': 'La confirmacion no coincide con el password nuevo.',
    'Password must contain an uppercase letter.': 'Debe tener al menos una mayuscula.',
    'Password must contain a lowercase letter.': 'Debe tener al menos una minuscula.',
    'Password must contain a number.': 'Debe tener al menos un numero.',
    'Password must contain a symbol.': 'Debe tener al menos un simbolo.',
    'MediaType must be Movie or Series.': 'Debe ser Movie o Series.',
    'Status must be WantToWatch, Watching, Watched or Dropped.': 'Debe ser Quiero ver, Viendo, Vista o Abandonada.',
    'Visibility must be Public, FriendsOnly or Private.': 'Debe ser Publica, Solo amigos o Privada.',
    'The Username field is required.': 'Completa el usuario.',
    'The Email field is required.': 'Completa el email.',
    'The Password field is required.': 'Completa el password.',
    'The CurrentPassword field is required.': 'Completa el password actual.',
    'The NewPassword field is required.': 'Completa el password nuevo.',
    'The ConfirmNewPassword field is required.': 'Confirma el password nuevo.',
    'The Identifier field is required.': 'Completa el email o usuario.',
    'The Title field is required.': 'Completa el titulo.',
    'The Body field is required.': 'Completa la reseña.',
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
    return 'La solicitud tiene datos invalidos. Revisa los campos e intenta de nuevo.'
  }

  if (status === 401) {
    return 'Tu sesion expiro o las credenciales no son validas. Inicia sesion nuevamente.'
  }

  if (status === 403) {
    return 'No tenes permiso para realizar esta accion.'
  }

  if (status === 404) {
    return 'No encontramos el recurso solicitado. Puede haber sido eliminado o no pertenecer a tu cuenta.'
  }

  if (status === 409) {
    return 'La accion entra en conflicto con algo que ya existe.'
  }

  if (status >= 500) {
    return 'El servidor tuvo un problema. Proba nuevamente mas tarde.'
  }

  return `La solicitud fallo con estado ${status}.`
}
