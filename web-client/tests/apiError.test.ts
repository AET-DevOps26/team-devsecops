import { errorMessage } from '../src/apiError'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}

describe('errorMessage', () => {
  it('returns the server message when present', async () => {
    const res = jsonResponse({ message: 'Username already taken' })
    expect(await errorMessage(res, 'fallback')).toBe('Username already taken')
  })

  it('falls back when the body is missing a message or unparseable', async () => {
    expect(await errorMessage(jsonResponse({ message: '   ' }), 'fallback')).toBe('fallback')
    const garbage = new Response('not json', { status: 500 })
    expect(await errorMessage(garbage, 'fallback')).toBe('fallback')
  })
})
