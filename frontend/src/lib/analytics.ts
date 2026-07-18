import { env } from './env'

/**
 * Inyecta el beacon de Cloudflare Web Analytics solo si hay token configurado.
 * `spa: true` hace que las navegaciones client-side de la SPA cuenten como page views.
 * El token no es secreto: viaja en el HTML del cliente igual.
 */
export function initCloudflareBeacon() {
  const token = env.cloudflareBeaconToken.trim()
  if (!token || typeof document === 'undefined') {
    return
  }

  if (document.querySelector('script[data-cf-beacon]')) {
    return
  }

  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa: true }))
  document.head.appendChild(script)
}
