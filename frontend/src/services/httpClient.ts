import { env } from '../lib/env'
import { getAccessToken, setAccessToken } from '../features/auth/services/authTokenStore'
import type { AuthResponse } from '../features/auth/types/auth.types'

type RequestOptions = RequestInit & {
  authToken?: string
}

export async function httpClient<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await sendRequest(path, options)

  if (response.status === 401 && !path.includes('/api/auth/refresh')) {
    const refreshResponse = await sendRequest('/api/auth/refresh', {
      method: 'POST',
    })

    if (refreshResponse.ok) {
      const auth = (await refreshResponse.json()) as AuthResponse
      setAccessToken(auth.accessToken)
      const retryResponse = await sendRequest(path, {
        ...options,
        authToken: auth.accessToken,
      })

      if (!retryResponse.ok) {
        throw new Error(`Request failed with status ${retryResponse.status}`)
      }

      return retryResponse.json() as Promise<TResponse>
    }
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}

async function sendRequest(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const authToken = options.authToken ?? getAccessToken()
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  return fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })
}
