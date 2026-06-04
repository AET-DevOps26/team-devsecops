import type { components } from './api'

type ErrorResponse = components['schemas']['ErrorResponse']

/**
 * Returns the server's ErrorResponse `message` from a failed response body,
 * falling back to `fallback` (or a generic message) when the body carries none.
 */
export async function errorMessage(res: Response, fallback?: string): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ErrorResponse>
    if (typeof data?.message === 'string' && data.message.trim() !== '') {
      return data.message
    }
  } catch {
    // fall through
  }
  return fallback ?? `An error occured. (HTTP ${res.status})`
}
