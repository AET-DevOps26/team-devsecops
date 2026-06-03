import type { components } from './api'

type ErrorResponse = components['schemas']['ErrorResponse']

/**
 * Returns the server's ErrorResponse `message` from a failed response body.
 */
export async function errorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ErrorResponse>
    if (typeof data?.message === 'string' && data.message.trim() !== '') {
      return data.message
    }
  } catch {
    // fall through
  }
  return `An error occured. (HTTP ${res.status})`
}
